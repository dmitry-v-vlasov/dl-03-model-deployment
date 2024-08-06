const BLANK_IMAGE_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=='

const loadImageEncodedBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = (error) => {
            reject(error);
        };

        fileReader.readAsDataURL(file);
    });
};

const setImageSourceBase64Encoded = (imageId, imageFormat, encodedImage) => {
    const image = document.querySelector(imageId);
    if (!image) {
        console.error(`Element with id ${imageId} not found.`);
        return;
    }

    if (encodedImage && imageFormat) {
        image.style.width = '100%';
        image.style.height = 'auto';
        image.setAttribute('src', `data:image/${imageFormat};base64,${encodedImage}`);
        image.style.display = 'block';
    } else {
        console.error(`Invalid image format or encoded image value: format - ${imageFormat}; image - ${encodedImage}`);
    }
}

const setImageSourceBlank = (imageId) => {
    const image = document.querySelector(imageId);
    if (!image) {
        console.error(`Element with id ${imageId} not found.`);
        return;
    }

    image.style.width = '1px';
    image.style.height = '1px';
    image.style.display = 'initial';
    image.setAttribute('src', `data:image/jpeg;base64,${BLANK_IMAGE_JPEG_BASE64}`);
}

// =================================================================

const displayClassificationData = (classificationData) => {
    const imageClassification = document.getElementById('image-classification');
    if (!imageClassification) {
        console.error(`Element with id 'image-classification' not found.`);
        return;
    }

    let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    
    for (const [key, value] of Object.entries(classificationData)) {
        if (key === 'Final class') {
            continue
        } else {
            table += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }
    }
    const key = 'Final class';
    const value = classificationData[key];
    table += `<tr class="bold"><td>${key}</td><td>${value}</td></tr>`;
    
    table += '</table>';

    imageClassification.innerHTML = table;
    imageClassification.style.display = 'block';
}

// =================================================================

const submitJsonForm = (e) => {
    e.preventDefault();

    const image_convert_form = document.getElementById('image-form');
    const formData = new FormData(image_convert_form);
    const fileImage = formData.get('image_file');

    if (!fileImage.name) {
        console.log('Image file not selected. Please select a file to upload/convert.');
        return;
    }

    const submitButton = document.getElementById('submit-button');
    const spinner = document.getElementById('spinner');
    const buttonText = document.querySelector('.button-text');
    
    spinner.style.display = 'inline-block';
    buttonText.style.display = 'none';

    loadImageEncodedBase64(fileImage).then(result => {
        const imageEncodedBase64 = result.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

        const message = {
            'image_file': fileImage.name,
            'image_data': imageEncodedBase64
        };

        fetch('/classify-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        }).then((response) => {
            return response.json()
        }).then((response) => {
            console.log(response);

            classificationData = response['image_classification'];
            displayClassificationData(classificationData);

            reencodedImage = response['reencoded_image'];
            setImageSourceBase64Encoded('#reencoded-image', 'jpeg', reencodedImage);

            const exifDataContainer = document.querySelector('#exif-data');
            if ('uploaded_image_exif_data' in response && response['uploaded_image_exif_data']) {
                const exifDataText = response['uploaded_image_exif_data'];
                exifDataContainer.innerHTML = exifDataText;
            } else {
                exifDataContainer.innerHTML = '';
            }

            spinner.style.display = 'none';
            buttonText.style.display = 'inline-block';
        }).catch((error) => {
            console.log(error);
            spinner.style.display = 'none';
            buttonText.style.display = 'inline-block';
        });

    }).catch(error => {
        console.log(error)
        spinner.style.display = 'none';
        buttonText.style.display = 'inline-block';
    });
};
