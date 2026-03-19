# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/gradcam.py — Gradient-weighted Class Activation Mapping
# -----------------------------------------------------------------------------
# PURPOSE:
#   Generates visual explanations of what the ML model "sees" on a leaf image.
#   Grad-CAM produces a heatmap highlighting the regions most influential to
#   the model's prediction — crucial for FYP defense and building trust in
#   the AI diagnosis.
#
# HOW IT WORKS:
#   1. Forward pass through the model to get predictions
#   2. Compute gradients of the predicted class w.r.t. the last conv layer
#   3. Pool gradients to get per-channel importance weights
#   4. Weight the conv layer's feature maps by these weights
#   5. Apply ReLU (keep only positive influence) and normalize
#   6. Overlay the heatmap on the original image using a colormap
#
# USAGE:
#   from ml.gradcam import get_gradcam_overlay
#   overlay = get_gradcam_overlay(model, 'path/to/leaf.jpg')
#   overlay.save('gradcam_result.png')
# =============================================================================

from pathlib import Path
from typing import Optional, Union

try:
    import numpy as np
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def _find_last_conv_layer(model: "tf.keras.Model") -> Optional["tf.keras.layers.Layer"]:
    """
    Finds the last convolutional layer in the model.

    For transfer learning models (like this project), the backbone is wrapped
    as a sublayer. We look inside it to find the last Conv2D layer, which
    produces the spatial feature maps that Grad-CAM visualizes.

    Works for both MobileNetV2 and EfficientNetV2 architectures.

    Args:
        model: The full Keras model (including augmentation + head).

    Returns:
        The last Conv2D layer, or None if not found.
    """
    # Find the backbone sublayer (first keras.Model inside the model)
    backbone = None
    for layer in model.layers:
        if isinstance(layer, tf.keras.Model):
            backbone = layer
            break

    if backbone is None:
        return None

    # Search backwards through backbone layers for the last Conv2D
    for layer in reversed(backbone.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer

    return None


def generate_gradcam(
    model: "tf.keras.Model",
    image_tensor: "tf.Tensor",
    class_index: Optional[int] = None
) -> Optional["np.ndarray"]:
    """
    Generates a Grad-CAM heatmap for the given image and model.

    For transfer learning models where the backbone is a nested sublayer,
    we re-trace the model layer-by-layer to build a multi-output grad model.
    The backbone's output (with include_top=False) provides the spatial
    feature maps needed for Grad-CAM.

    Args:
        model: Trained Keras model.
        image_tensor: Preprocessed image tensor of shape (1, H, W, 3).
        class_index: Target class index. If None, uses the predicted class.

    Returns:
        Heatmap as a numpy array of shape (H, W) with values in [0, 1],
        where H, W are the spatial dimensions of the backbone output.
        Returns None if Grad-CAM generation fails.
    """
    if not TF_AVAILABLE:
        return None

    try:
        # Find the backbone sublayer — its output (with include_top=False)
        # IS the spatial feature maps from the last conv block
        backbone = None
        for layer in model.layers:
            if isinstance(layer, tf.keras.Model):
                backbone = layer
                break

        if backbone is None:
            return None

        # Re-trace through model layers to build a multi-output grad model.
        # This is necessary because the backbone's internal layer outputs
        # are not directly connected to the outer model's input graph.
        # We use the backbone's output as the conv feature maps for Grad-CAM.
        inp = tf.keras.Input(shape=image_tensor.shape[1:])
        x = inp
        conv_output_tensor = None
        for layer in model.layers:
            if isinstance(layer, tf.keras.layers.InputLayer):
                continue
            x = layer(x)
            if layer is backbone:
                conv_output_tensor = x

        if conv_output_tensor is None:
            return None

        grad_model = tf.keras.Model(
            inputs=inp, outputs=[conv_output_tensor, x]
        )

        # Forward pass with gradient recording
        with tf.GradientTape() as tape:
            conv_output, predictions = grad_model(image_tensor)
            if class_index is None:
                class_index = tf.argmax(predictions[0])
            class_output = predictions[:, class_index]

        # Compute gradients of the target class w.r.t. conv layer output
        grads = tape.gradient(class_output, conv_output)
        if grads is None:
            return None

        # Global average pooling of gradients → per-channel importance
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight each channel by its importance and sum
        heatmap = conv_output[0] @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # ReLU: keep only positive contributions (regions that help predict the class)
        heatmap = tf.maximum(heatmap, 0)

        # Normalize to [0, 1]
        max_val = tf.reduce_max(heatmap)
        if max_val > 0:
            heatmap = heatmap / max_val

        return heatmap.numpy()

    except Exception as e:
        print(f"[Grad-CAM] Generation failed: {e}")
        return None


def overlay_gradcam(
    original_image: "np.ndarray",
    heatmap: "np.ndarray",
    alpha: float = 0.4
) -> Optional["Image.Image"]:
    """
    Overlays a Grad-CAM heatmap on the original image.

    Uses matplotlib's 'jet' colormap (blue=cold → red=hot) to visualize
    which regions of the leaf influenced the prediction most.

    Args:
        original_image: Original image as numpy array (H, W, 3) in [0, 255].
        heatmap: Grad-CAM heatmap (h, w) with values in [0, 1].
        alpha: Blend factor. 0.4 = 40% heatmap + 60% original.

    Returns:
        PIL Image with the heatmap overlay, or None on failure.
    """
    if not PIL_AVAILABLE:
        return None

    try:
        import matplotlib

        # Resize heatmap to match original image dimensions
        heatmap_resized = np.array(
            Image.fromarray((heatmap * 255).astype(np.uint8)).resize(
                (original_image.shape[1], original_image.shape[0]),
                Image.BILINEAR
            )
        ).astype(np.float32) / 255.0

        # Apply jet colormap (returns RGBA)
        colormap = matplotlib.colormaps['jet']
        heatmap_colored = colormap(heatmap_resized)[:, :, :3]  # Drop alpha
        heatmap_colored = (heatmap_colored * 255).astype(np.uint8)

        # Ensure original image is uint8
        if original_image.dtype != np.uint8:
            original_image = np.clip(original_image, 0, 255).astype(np.uint8)

        # Blend: overlay = alpha * heatmap + (1 - alpha) * original
        overlay = (
            alpha * heatmap_colored.astype(np.float32)
            + (1 - alpha) * original_image.astype(np.float32)
        )
        overlay = np.clip(overlay, 0, 255).astype(np.uint8)

        return Image.fromarray(overlay)

    except Exception as e:
        print(f"[Grad-CAM] Overlay failed: {e}")
        return None


def get_gradcam_overlay(
    model: "tf.keras.Model",
    image_source: Union[str, bytes],
    img_size: int = 224,
    class_index: Optional[int] = None,
    alpha: float = 0.4
) -> Optional["Image.Image"]:
    """
    High-level convenience function: image → Grad-CAM overlay.

    Takes a model and image (path or bytes), produces a PIL Image with
    the Grad-CAM heatmap overlaid on the original leaf photo.

    Args:
        model: Trained Keras model.
        image_source: File path (str) or raw bytes.
        img_size: Image size the model was trained on.
        class_index: Target class. None = use predicted class.
        alpha: Blend factor for overlay.

    Returns:
        PIL Image with heatmap overlay, or None on failure.
    """
    if not TF_AVAILABLE or not PIL_AVAILABLE:
        return None

    try:
        # Load and decode image
        if isinstance(image_source, (str, Path)):
            raw = tf.io.read_file(str(image_source))
            image = tf.image.decode_image(raw, channels=3, expand_animations=False)
        else:
            image = tf.image.decode_image(image_source, channels=3, expand_animations=False)

        # Keep original for overlay (before resize)
        original_np = image.numpy()

        # Preprocess for model
        image_resized = tf.image.resize(image, [img_size, img_size])
        image_resized = tf.cast(image_resized, tf.uint8)
        image_tensor = tf.expand_dims(image_resized, axis=0)

        # Generate heatmap
        heatmap = generate_gradcam(model, image_tensor, class_index)
        if heatmap is None:
            return None

        # Resize original to model input size for consistent overlay
        original_resized = tf.image.resize(image, [img_size, img_size])
        original_resized = tf.cast(original_resized, tf.uint8).numpy()

        return overlay_gradcam(original_resized, heatmap, alpha)

    except Exception as e:
        print(f"[Grad-CAM] get_gradcam_overlay failed: {e}")
        return None
