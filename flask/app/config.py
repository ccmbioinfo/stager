import os


class Config(object):
    """
    The base config. All shared config values are kept here.
    """

    GIT_SHA = os.getenv("GIT_SHA")
    SECRET_KEY = os.getenv("ST_SECRET_KEY", "YOUR_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "ST_DATABASE_URI", "mysql+pymysql://admin:admin@localhost/st2020"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_LOG = True
    DEFAULT_ADMIN = os.getenv("ST_DEFAULT_ADMIN", "admin")
    DEFAULT_ADMIN_EMAIL = os.getenv(
        "ST_DEFAULT_EMAIL", "admin@sampletracker.ccm.sickkids.ca"
    )
    DEFAULT_PASSWORD = os.getenv("ST_DEFAULT_PASSWORD", "eternity")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_TLS = not not os.getenv("MINIO_TLS")
    MINIO_SECRET_KEY = os.getenv(
        "MINIO_SECRET_KEY", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    )
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "AKIAIOSFODNN7EXAMPLE")
    MINIO_REGION_NAME = os.getenv("MINIO_REGION_NAME", "hpc4health")
    SLURM_ENDPOINT = os.getenv("SLURM_ENDPOINT")
    SLURM_USER = os.getenv("SLURM_USER")
    SLURM_JWT = os.getenv("SLURM_JWT")
    SLURM_PWD = os.getenv("SLURM_PWD", f"/home/{os.getenv('SLURM_USER')}")
    CRG2_ENTRYPOINT = os.getenv("CRG2_ENTRYPOINT", "./dnaseq_slurm_api.sh")
    TESTING = False
    ENABLE_OIDC = os.getenv("ENABLE_OIDC", "") != ""
    OIDC_PROVIDER = os.getenv("OIDC_PROVIDER", "keycloak")
    # needed for authlib (dynamically named keys)
    OIDC_CLIENT_ID = os.getenv("OIDC_CLIENT_ID", "ccm-stager")
    OIDC_CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "$not_a_secret!")
    OIDC_WELL_KNOWN = os.getenv(
        "OIDC_WELL_KNOWN",
        "http://keycloak:8080/auth/realms/ccm/.well-known/openid-configuration",
    )
    MSTEAMS_WEBHOOK_URL = os.getenv("MSTEAMS_WEBHOOK_URL")
    # LOGIN_DISABLED = True
