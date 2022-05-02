import pandas as pd
import numpy as np


def test_csv_dtypes():
    """for _bulk, to test a column of ints from a csv is correctly parsed as an object"""
    df = pd.read_csv("tests/samplecsv2.csv")
    assert df.dtypes["family_codename"] == np.int64
    df2 = pd.read_csv(
        "tests/samplecsv2.csv",
        dtype={"family_codename": object, "participant_codename": object},
    )
    assert df2.dtypes["family_codename"] == "O"
