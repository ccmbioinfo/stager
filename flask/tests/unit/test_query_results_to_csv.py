""" test query_results_to_csv function """
from csv import reader
from dataclasses import dataclass
from flask_sqlalchemy import SQLAlchemy
from app.utils import query_results_to_csv

db = SQLAlchemy()


@dataclass
class ModelFake(db.Model):
    """ a class for testing the function """

    __tablename__ = "faker"
    string_col: str = db.Column(db.String(50), primary_key=True)
    integer_col: str = db.Column(db.Integer)


def test_creates_a_valid_csv():
    """ can we get a csv that csv.reader can process and whose contents are accurate? """
    csv = query_results_to_csv([ModelFake(string_col="foo", integer_col=2)])
    results_reader = reader(csv.split("\n"))
    cols = ModelFake.metadata.tables["faker"].columns.keys()
    for i, row in enumerate(list(results_reader)[:-1]):  # last row is empty
        if i == 0:
            for item in row:
                assert item in cols
        else:
            assert len(row) == len(cols)


def test_can_pass_a_dictionary():
    """ can we pass a dictionary in place of a model? """
    test_dict = {"foo": "bar", "baz": 2}
    csv = query_results_to_csv([test_dict])
    results_reader = reader(csv.split("\n"))
    for i, row in enumerate(list(results_reader)[:-1]):  # last row is empty
        if i == 0:
            for item in row:
                assert item in test_dict.keys()
        else:
            assert len(row) == len(test_dict.keys())
