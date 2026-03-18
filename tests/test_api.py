# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# tests/test_api.py — FastAPI Endpoint Tests
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Tests the three FastAPI endpoints using httpx's AsyncClient.
#   These tests validate the API contract, not the DSS logic itself.
#   DSS logic is tested in test_dss.py.
#
# HOW TO RUN:
#   pytest tests/test_api.py -v
#
# DEPENDENCIES:
#   pip install httpx pytest pytest-asyncio
# =============================================================================

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from api.main import app


# =============================================================================
# SHARED FIXTURE — provides a running test client
# =============================================================================

@pytest_asyncio.fixture
async def client():
    """Async HTTP client pointed at the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


# =============================================================================
# /questionnaire ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_questionnaire_endpoint_blast(client):
    """
    Classic blast case should return blast as primary condition
    via the /questionnaire endpoint.
    """
    payload = {
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['leaf_blade', 'panicle'],
        'symptom_origin': 'upper_leaves',
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'fertilizer_type': 'balanced_npk',
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'symptom_timing': 'around_flowering',
        'onset_speed': 'sudden',
        'previous_disease': 'yes_same',
        'previous_crop': 'rice_same',
        'soil_type': 'unsure',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }
    response = await client.post('/questionnaire', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['condition_key'] == 'blast'
    assert data['mode_used'] == 'Questionnaire Only'


@pytest.mark.asyncio
async def test_questionnaire_endpoint_returns_required_keys(client):
    """Every /questionnaire response must contain the standard output keys."""
    payload = {
        'symptoms': ['yellowing'],
        'farmer_confidence': 'not_sure',
        'additional_symptoms': ['none'],
    }
    response = await client.post('/questionnaire', json=payload)
    assert response.status_code == 200
    data = response.json()
    for key in ['status', 'condition_key', 'score', 'all_scores', 'recommendations']:
        assert key in data, f"Missing key: {key}"


# =============================================================================
# /ml-only ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_ml_only_endpoint_blast(client):
    """
    ML-only endpoint with high blast probability should return blast.
    """
    payload = {
        'symptoms': ['dark_spots'],
        'additional_symptoms': ['none'],
        'ml_probabilities': {
            'blast': 0.85,
            'brown_spot': 0.10,
            'bacterial_blight': 0.05
        }
    }
    response = await client.post('/ml-only', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['condition_key'] == 'blast'
    assert data['mode_used'] == 'ML Only'


@pytest.mark.asyncio
async def test_ml_only_no_probabilities(client):
    """
    /ml-only with no ml_probabilities should return no_image status.
    """
    payload = {
        'symptoms': ['yellowing'],
        'additional_symptoms': ['none'],
    }
    response = await client.post('/ml-only', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'no_image'


@pytest.mark.asyncio
async def test_ml_only_includes_non_biotic_warning(client):
    """
    /ml-only response should always warn that non-biotic stresses cannot be detected.
    """
    payload = {
        'symptoms': ['yellowing'],
        'additional_symptoms': ['none'],
        'ml_probabilities': {
            'blast': 0.70,
            'brown_spot': 0.20,
            'bacterial_blight': 0.10
        }
    }
    response = await client.post('/ml-only', json=payload)
    data = response.json()
    warnings = data.get('warnings', [])
    assert any('non-biotic' in w.lower() or 'nutrient' in w.lower() for w in warnings), \
        f"Expected non-biotic warning in {warnings}"


# =============================================================================
# /hybrid ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_hybrid_endpoint_bacterial_blight_with_ooze(client):
    """
    Hybrid endpoint: morning ooze should lock to bacterial_blight
    regardless of ML probabilities (pathognomonic lock).
    """
    payload = {
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'white_tips', 'dried_areas'],
        'symptom_location': ['leaf_blade'],
        'farmer_confidence': 'very_sure',
        'water_condition': 'flooded_continuously',
        'weather': 'heavy_rain',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'additional_symptoms': ['morning_ooze'],
        # ML disagrees — but pathognomonic lock should override
        'ml_probabilities': {
            'blast': 0.60,
            'brown_spot': 0.30,
            'bacterial_blight': 0.10
        }
    }
    response = await client.post('/hybrid', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['condition_key'] == 'bacterial_blight'
    assert data['mode_used'] == 'Hybrid (Recommended)'


@pytest.mark.asyncio
async def test_hybrid_non_biotic_overrides_ml(client):
    """
    Hybrid endpoint: iron toxicity (non-biotic) should override even if ML
    strongly says blast. Non-biotic dominance must hold.
    """
    payload = {
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'brown_discoloration'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'very_sure',
        'water_condition': 'flooded_continuously',
        'symptom_timing': 'right_after_transplant',
        'onset_speed': 'gradual',
        'soil_type': 'kbal_po',
        'soil_cracking': 'large_cracks',
        'spread_pattern': 'most_of_field',
        'additional_symptoms': ['purple_roots'],
        # ML strongly says blast — should be IGNORED for non-biotic
        'ml_probabilities': {
            'blast': 0.90,
            'brown_spot': 0.05,
            'bacterial_blight': 0.05
        }
    }
    response = await client.post('/hybrid', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['condition_key'] == 'iron_toxicity', (
        f"Non-biotic dominance failed — expected iron_toxicity, got {data['condition_key']}"
    )


# =============================================================================
# /explain ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_explain_endpoint_returns_all_conditions(client):
    """
    /explain should return signal breakdowns for all 6 conditions
    plus confidence_modifier and confidence_source.
    """
    payload = {
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['leaf_blade', 'panicle'],
        'farmer_confidence': 'very_sure',
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'additional_symptoms': ['none'],
    }
    response = await client.post('/explain', json=payload)
    assert response.status_code == 200
    data = response.json()

    explanations = data['explanations']
    for cond in ['blast', 'brown_spot', 'bacterial_blight',
                 'iron_toxicity', 'n_deficiency', 'salt_toxicity']:
        assert cond in explanations, f"Missing condition: {cond}"
        assert 'signals' in explanations[cond]
        assert 'raw_total' in explanations[cond]

    assert 'confidence_modifier' in explanations
    assert 'confidence_source' in explanations


@pytest.mark.asyncio
async def test_explain_endpoint_blast_has_signals(client):
    """
    For a classic blast case, the blast explanation should have positive signals.
    """
    payload = {
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots'],
        'symptom_location': ['panicle'],
        'farmer_confidence': 'very_sure',
        'weather': 'high_humidity',
        'additional_symptoms': ['none'],
    }
    response = await client.post('/explain', json=payload)
    data = response.json()

    blast_signals = data['explanations']['blast']['signals']
    assert len(blast_signals) > 0, "Blast should have active signals"
    # At least one positive signal
    assert any(s['weight'] > 0 for s in blast_signals)


@pytest.mark.asyncio
async def test_explain_endpoint_empty_input(client):
    """
    /explain with minimal input should still return valid structure.
    """
    payload = {
        'symptoms': ['yellowing'],
        'farmer_confidence': 'not_sure',
        'additional_symptoms': ['none'],
    }
    response = await client.post('/explain', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 'explanations' in data


# =============================================================================
# /logs ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_logs_summary_endpoint(client):
    """
    /logs/summary should return aggregate run statistics.
    """
    response = await client.get('/logs/summary')
    assert response.status_code == 200
    data = response.json()
    assert 'total_runs' in data


@pytest.mark.asyncio
async def test_logs_runs_endpoint(client):
    """
    /logs/runs should return a list of recent runs.
    """
    # First make a DSS call so there's something to log
    await client.post('/questionnaire', json={
        'symptoms': ['yellowing'],
        'farmer_confidence': 'not_sure',
        'additional_symptoms': ['none'],
    })
    response = await client.get('/logs/runs')
    assert response.status_code == 200
    data = response.json()
    assert 'runs' in data
    assert 'total' in data


# =============================================================================
# /predict-image and /hybrid-image ENDPOINT TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_predict_image_no_model(client):
    """
    /predict-image should return 503 when no trained model is available.
    """
    # Create a minimal valid JPEG-like file
    fake_image = b'\xff\xd8\xff\xe0' + b'\x00' * 100
    response = await client.post(
        '/predict-image',
        files={'image': ('test.jpg', fake_image, 'image/jpeg')}
    )
    # 503 if no model exists, or other error — either way not 200
    assert response.status_code in (503, 422, 500)


@pytest.mark.asyncio
async def test_hybrid_image_no_model(client):
    """
    /hybrid-image should return 503 when no trained model is available.
    """
    import json
    fake_image = b'\xff\xd8\xff\xe0' + b'\x00' * 100
    questionnaire = json.dumps({
        'symptoms': ['dark_spots'],
        'farmer_confidence': 'somewhat_sure',
        'additional_symptoms': ['none'],
    })
    response = await client.post(
        '/hybrid-image',
        files={'image': ('test.jpg', fake_image, 'image/jpeg')},
        data={'questionnaire': questionnaire}
    )
    assert response.status_code in (503, 422, 500)
