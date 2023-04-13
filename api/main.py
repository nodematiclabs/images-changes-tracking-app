import json
import os
from google.cloud import storage

def delete_gcs_object(request):
    request_api_token = request.headers.get("X-API-Token")
    if request_api_token != os.environ.get("API_TOKEN"):
        return json.dumps({"error": "Invalid API token"}), 401

    if request.method != 'POST':
        return json.dumps({'error': 'Invalid request method'}), 405

    data = request.get_json(silent=True)

    if 'bucketName' not in data or 'objectName' not in data:
        return json.dumps({'error': 'Please provide both "bucketName" and "objectName" in the request body.'}), 400

    bucket_name = data['bucketName']
    object_name = data['objectName']

    try:
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket_name)
        blob = bucket.blob(object_name)
        blob.delete()

        return json.dumps({'message': f'Object "{object_name}" deleted from bucket "{bucket_name}".'}), 200

    except Exception as error:
        print('Error deleting object:', error)
        return json.dumps({'error': 'Internal Server Error'}), 500