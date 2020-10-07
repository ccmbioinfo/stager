from datetime import datetime
from werkzeug.routing import BaseConverter


class DateConverter(BaseConverter):

    def to_python(self, value):
        return datetime.strptime(value, "%Y-%m-%d").date()

    def to_url(self, value):
        return value.strftime('%Y-%m-%d')
