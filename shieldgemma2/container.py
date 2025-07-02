import os
import dotenv
import argparse
import json
import logging

from google.cloud.aiplatform.prediction import LocalModel
from google.cloud import aiplatform
from predictor import ShieldGemma2Predictor

dotenv.load_dotenv()
GOOGLE_CLOUD_REGION = os.getenv("GOOGLE_CLOUD_REGION")
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")

logging.basicConfig(level=logging.DEBUG)

print("Initializing Vertex AI SDK...")
aiplatform.init(project=GOOGLE_CLOUD_PROJECT, location=GOOGLE_CLOUD_REGION)

parser = argparse.ArgumentParser(description="Build/Upload and Deploy ShieldGemma2 Predictor")
parser.add_argument(
    "--rebuild",
    action="store_true",
    help="Flag to force rebuilding the container image and uploading a new model version.",
)
parser.add_argument(
    "--upload",
    action="store_true",
    help="Flag to upload the model to Vertex AI.",
)
parser.add_argument(
    "--push",
    action="store_true",
    help="Flag to push the container image to the container registry.",
)
parser.add_argument(
    "--deploy",
    action="store_true",
    help="Flag to deploy the model to Vertex AI.",
)
parser.add_argument(
    "--predict",
    action="store_true",
    help="Flag to submit a prediction request using instances.json.",
)
parser.add_argument(
    "--local",
    action="store_true",
    help="Flag to deploy the model to a local endpoint.",
)
args = parser.parse_args()

container_uri = f"{GOOGLE_CLOUD_REGION}-docker.pkg.dev/{GOOGLE_CLOUD_PROJECT}/ai/shieldgemma2-predictor"
artifact_uri = f"gs://{GOOGLE_CLOUD_PROJECT}_ai/shieldgemma-2-4b-it"

if args.rebuild:
    print("Rebuilding container image...")
    local_model = LocalModel.build_cpr_model(
        os.getcwd(),
        container_uri,
        predictor=ShieldGemma2Predictor,
        requirements_path=os.path.join(os.getcwd(), "requirements.txt"),
        base_image="pytorch/pytorch:2.7.1-cuda12.8-cudnn9-runtime",
    )
else:
    print("Loading existing container image...")
    local_model = LocalModel(serving_container_image_uri=container_uri)

if args.push:
    print("Pushing container image...")
    local_model.push_image()

if args.local:
    print("Deploying local endpoint...")
    with local_model.deploy_to_local_endpoint(
        artifact_uri=f"/home/user/src/shieldgemma-2-4b-it",
    ) as local_endpoint:    
        health_check_response = local_endpoint.run_health_check()
        print(health_check_response)

        predict_response = local_endpoint.predict(
            request_file="instances.json",
            headers={"Content-Type": "application/json"},
        )
        print(predict_response)

existing_models = aiplatform.Model.list(
    filter=f'display_name="ShieldGemma2"',
    location=GOOGLE_CLOUD_REGION
)

model = None
if args.upload:    
    upload_params = {
        "serving_container_image_uri": container_uri,
        "display_name": "ShieldGemma2",
        "is_default_version": True,
        "artifact_uri": artifact_uri,
        "location": GOOGLE_CLOUD_REGION,
        "serving_container_environment_variables": {
            "VERTEX_CPR_WEB_CONCURRENCY": "1"
        }
    }

    if existing_models:
        print("Found existing model, uploading new version...")
        parent_model = existing_models[0]
        model = aiplatform.Model.upload(
            parent_model=parent_model.resource_name,
            **upload_params,
        )
        print(f"Added new version: {model.version_id}")
    else:
        print("No existing model found, creating new model...")
        model = aiplatform.Model.upload(
            **upload_params,
        )

if args.deploy:
    if not args.upload:
        if not existing_models:
            print("Error: No existing model found to deploy. Please use --upload to create a new model first.")
            exit(1)
        print("Using latest model version for deployment...")
        sorted_models = sorted(existing_models, key=lambda x: x.version_id, reverse=True)
        model = sorted_models[0]
        print(f"Deploying version: {model.version_id}")

    print("Checking for existing endpoint...")

    deploy_params = {
        "machine_type": "g2-standard-12",
        "accelerator_type": "NVIDIA_L4",
        "accelerator_count": 1,
        "traffic_percentage": 100,
        "disable_container_logging": False,
        "enable_access_logging": True,
    }

    endpoints = aiplatform.Endpoint.list(
        filter=f'display_name="ShieldGemma2_endpoint"',
        location=GOOGLE_CLOUD_REGION
    )

    if len(endpoints) > 0:
        print("Found existing endpoint, deploying to it...")
        endpoint = endpoints[0]
        endpoint.deploy(
            model=model,
            **deploy_params
        )
    else:
        print("No existing endpoint found, creating new endpoint...")
        endpoint = aiplatform.Endpoint.create(
            display_name="ShieldGemma2_endpoint",
            location=GOOGLE_CLOUD_REGION,
            inference_timeout=600,
        )
        endpoint.deploy(
            model=model,
            **deploy_params
        )

if args.predict:
    print("Fetching endpoint...")
    endpoints = aiplatform.Endpoint.list(
        filter=f'display_name="ShieldGemma2_endpoint"',
        location=GOOGLE_CLOUD_REGION
    )
    if len(endpoints) == 0:
        print("Error: No endpoint found. Please deploy the model first.")
        exit(1)
    endpoint = endpoints[0]
    
    print("Loading instances...")
    with open("instances.json", "r") as f:
        instances = json.load(f)
    
        print("Submitting prediction request...")
        predict_response = endpoint.predict(
            instances=instances["instances"],
            parameters=instances["parameters"],
            timeout=600,
        )
        print("Prediction response:", predict_response)
  