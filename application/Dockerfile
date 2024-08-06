FROM tensorflow/tensorflow:2.16.1

COPY ./requirements.txt /app/requirements.txt

WORKDIR /app

RUN apt remove -y python3-blinker

RUN pip install -r requirements.txt --timeout=300

COPY . /app

# RUN mkdir -p /app/model
# COPY ./model/model.zip /app/model/model.zip

EXPOSE 5000

ENTRYPOINT [ "python" ]

CMD [ "main.py" ]
