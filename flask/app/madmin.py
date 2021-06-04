import json, os, subprocess
from typing import Any, Dict, List, Optional, Union


class MinioAdmin:
    _name = "app"

    def __init__(self, endpoint: str, access_key: str, secret_key: str, secure=False):
        protocol = "https" if secure else "http"
        self._url = f"{protocol}://{access_key}:{secret_key}@{endpoint}"

    def _exec(self, cmd: List[str], params: List[str] = []) -> str:
        env = os.environ.copy()
        env[f"MC_HOST_{self._name}"] = self._url
        result = subprocess.run(
            ["mc", "--config-dir", "/tmp/.mc", "--json", "admin"]
            + cmd
            + [self._name]
            + params,
            env=env,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stdout)
        return result.stdout

    def list_users(self) -> List[Dict[str, Any]]:
        raw = self._exec(["user", "list"]).strip()
        if not raw:
            return []
        return [json.loads(user) for user in raw.split("\n")]

    def get_user(self, access_key) -> Dict[str, Any]:
        raw_user = self._exec(["user", "info"], [access_key])
        return json.loads(raw_user)

    def add_user(self, access_key: str, secret_key: str) -> None:
        self._exec(["user", "add"], [access_key, secret_key])

    def disable_user(self, access_key: str) -> None:
        self._exec(["user", "disable"], [access_key])

    def enable_user(self, access_key: str) -> None:
        self._exec(["user", "enable"], [access_key])

    def remove_user(self, access_key: str) -> None:
        self._exec(["user", "remove"], [access_key])

    def list_groups(self) -> List[str]:
        raw = self._exec(["group", "list"]).strip()
        if not raw:
            return []
        result = json.loads(raw)
        if "groups" not in result:
            return []
        return result["groups"]

    def get_group(self, group: str) -> Dict[str, Any]:
        raw_group = self._exec(["group", "info"], [group])
        return json.loads(raw_group)

    def group_add(self, group: str, *args: str) -> None:
        """
        Add as many listed users as possible to the group, creating the group
        if it does not exist already.
        """
        self._exec(["group", "add"], [group, *args])

    def disable_group(self, group: str) -> None:
        self._exec(["group", "disable"], [group])

    def enable_group(self, group: str) -> None:
        self._exec(["group", "enable"], [group])

    def group_remove(self, group: str, *users: str) -> None:
        """
        Remove as many listed users as possible from the group, or remove the
        group if no arguments are provided and it is empty.
        """
        self._exec(["group", "remove"], [group, *users])

    def list_policies(self) -> List[Dict[str, Any]]:
        raw = self._exec(["policy", "list"]).strip()
        if not raw:
            return []
        return [json.loads(policy) for policy in raw.split("\n")]

    def get_policy(self, policy: str) -> Dict[str, Any]:
        raw_policy = self._exec(["policy", "info"], [policy])
        return json.loads(raw_policy)

    def add_policy(self, name: str, policy: Union[str, Dict[str, Any]]) -> None:
        if not isinstance(policy, str):
            policy = json.dumps(policy)
        file_name = f"/tmp/{name}.json"
        with open(file_name, mode="w") as policy_file:
            policy_file.write(policy)
        self._exec(["policy", "add"], [name, file_name])
        os.remove(file_name)

    def set_policy(
        self, policy: str, user: Optional[str] = None, group: Optional[str] = None
    ) -> None:
        if not user and not group or user and group:
            raise ValueError("Must provide exactly one of user or group")
        if user:
            self._exec(["policy", "set"], [policy, f"user={user}"])
        if group:
            self._exec(["policy", "set"], [policy, f"group={group}"])

    def remove_policy(self, policy: str) -> None:
        self._exec(["policy", "remove"], [policy])


def readonly_buckets_policy(*buckets: str) -> Dict[str, Any]:
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:GetBucketLocation", "s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket}/*" for bucket in buckets],
            }
        ],
    }


def readwrite_buckets_policy(*buckets: str) -> Dict[str, Any]:
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:*"],
                "Resource": [f"arn:aws:s3:::{bucket}/*" for bucket in buckets],
            }
        ],
    }


# This is Stager-specific and probably not to be included if this module is made independent
def stager_buckets_policy(*buckets: str) -> Dict[str, Any]:
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:*"],
                "Resource": [f"arn:aws:s3:::{bucket}/*" for bucket in buckets],
            },
            {
                "Effect": "Deny",
                "Action": [
                    "s3:DeleteBucket",
                    "s3:ForceDeleteBucket",
                    "s3:DeleteObject",
                    "s3:DeleteObjectVersion",
                ],
                "Resource": [f"arn:aws:s3:::{bucket}/*" for bucket in buckets],
            },
        ],
    }
