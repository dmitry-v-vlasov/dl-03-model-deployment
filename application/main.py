import os
import io
import traceback
import pathlib as paths
import base64
from sys import stdout

from flask import Flask, render_template, request, jsonify
from http import HTTPStatus
from PIL import Image

from pprint import pformat

import logging

from maat_machine.model import cv as mt_model_cv
from maat_machine.model import utils as mt_model_utils


# Define logger
LOGGER = logging.getLogger('Application')
LOGGER.setLevel(logging.DEBUG)
LOG_FORMATTER = logging.Formatter("%(name)-12s %(asctime)s %(levelname)-8s %(filename)s:%(funcName)s %(message)s")
CONSOLE_HANDLER = logging.StreamHandler(stdout) #set streamhandler to stdout
CONSOLE_HANDLER.setFormatter(LOG_FORMATTER)
LOGGER.addHandler(CONSOLE_HANDLER)


LOGGER.info(f"🕸️ Loading model...")
MODEL_DIRECTORY = paths.Path('/app/model')
LOGGER.info(f"🕸️ Model directory: {MODEL_DIRECTORY}; Content: {list(MODEL_DIRECTORY.iterdir())}")
MODEL = mt_model_cv.CNNCustomClassifier.load_unpacked(MODEL_DIRECTORY)
LOGGER.info(f"🕸️ Loading model... Done")

APP = Flask(__name__)


@APP.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@APP.route('/classify-image', methods=['POST'])
def classify_image():
    try:
        assert request.is_json
        assert MODEL

        message = request.json
        image_file = message['image_file']
        image_data = message['image_data']
        
        print(f"image_file = {image_file}, len(image_data) = '{len(image_data)}'")

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image_classification = MODEL.predict_proba_from_pil_image(image)
        final_class = max(image_classification, key=image_classification.get)
        image_classification = {k: round(float(v), 3) for k, v in image_classification.items()}

        image_classification['Final class'] = final_class

        # image_classification = {
        #     'Ferrari': 0.7,
        #     'Mercedes': 0.2,
        #     'Renault': 0.1,
        #     'Final class': 'Ferrari'
        # }

        reencoded_image = base64.b64encode(image_bytes).decode('ascii')

        return jsonify({ 'image_classification': image_classification, 'reencoded_image': reencoded_image }), HTTPStatus.OK
    except KeyError as e:
        LOGGER.error(f"Missing message key: {e}; Stack trace: {traceback.format_exc()}")
        return jsonify({ 'error': f"Missing message key: {e}" }), HTTPStatus.BAD_REQUEST
    except AssertionError as e:
        LOGGER.error(f"Message is invalid: {e}; Stack trace: {traceback.format_exc()}")
        return jsonify({ 'error': f"Message is invalid: {e}; Stack trace: {traceback.format_exc()}" }), HTTPStatus.BAD_REQUEST
    except Exception as e:
        LOGGER.error(f"Unexpected error: {e}; Stack trace: {traceback.format_exc()}")
        return jsonify({ 'error': f"Unexpected error: {e}; Stack trace: {traceback.format_exc()}" }), HTTPStatus.INTERNAL_SERVER_ERROR


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    APP.run(debug=False, host='0.0.0.0', port=port)
