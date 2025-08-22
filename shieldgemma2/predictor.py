import logging
import torch
import numpy as np
import base64
import io
from typing import Any, Dict
from PIL import Image
from transformers import AutoProcessor, ShieldGemma2ForImageClassification, logging as transformers_logging

from google.cloud.aiplatform.prediction.predictor import Predictor
from google.cloud.aiplatform.utils import prediction_utils

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

transformers_logging.set_verbosity_info()

model_id = "google/shieldgemma-2-4b-it"

class ShieldGemma2Predictor(Predictor):
    def __init__(self) -> None:
        pass
    
    def load(self, artifacts_uri: str) -> None:
        """Loads the preprocessor and model artifacts."""
        logger.info(f"Downloading artifacts from {artifacts_uri}")
        prediction_utils.download_model_artifacts(artifacts_uri)
        logger.info("Artifacts successfully downloaded.")


        self.model = ShieldGemma2ForImageClassification.from_pretrained(".", torch_dtype=torch.bfloat16, device_map="auto")
        logger.info("Model successfully loaded.")

        self.processor = AutoProcessor.from_pretrained(".", use_fast=True, torch_dtype=torch.bfloat16)
        logger.info("Processor successfully loaded.")

    def preprocess(self, prediction_input):
        images = [Image.open(io.BytesIO(base64.b64decode(instance["bytesBase64Encoded"]))).convert("RGB") 
                  for instance in prediction_input["instances"]]
        custom_policies = prediction_input["parameters"]["custom_policies"]
        policies = ["dangerous", "sexual", "violence" ] + [policy_name for policy_name in custom_policies.keys()]
        logger.info(f"Policies: {policies}")
        logger.info(f"Custom policies: {custom_policies}")
        
        processor_output = self.processor(images=images, 
                                          return_tensors="pt", 
                                          custom_policies=custom_policies, 
                                          policies=policies).to(self.model.device)
        
        # Add policies to the processor output so they're available in predict
        processor_output['policies'] = policies
        
        return processor_output

    def predict(self, model_inputs):
        with torch.inference_mode():
            scores = self.model(**model_inputs)
            logger.info(f"Scores: {scores}")
            
            policies = model_inputs.get('policies', [])
            del model_inputs['policies']
            
            if hasattr(scores, 'logits'):
                logits = scores.logits.cpu().float().numpy().tolist()
            else:
                logits = None
                
            if hasattr(scores, 'probabilities'):
                probabilities = scores.probabilities.cpu().float().numpy().tolist()
            else:
                probabilities = None
            
            output = {}
            
            if logits is not None and probabilities is not None and policies is not None:
                for i, policy in enumerate(policies):
                    output[policy] = {  
                        "logits": logits[i],
                        "probabilities": probabilities[i]
                    }
            
            return {"predictions": [output]}
        