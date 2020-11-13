import pytest
from app.madmin import MinioAdmin, readonly_buckets_policy, readwrite_buckets_policy
from conftest import TestConfig


@pytest.fixture
def mc():
    return MinioAdmin(
        endpoint=TestConfig.MINIO_ENDPOINT,
        access_key=TestConfig.MINIO_ACCESS_KEY,
        secret_key=TestConfig.MINIO_SECRET_KEY,
    )


def test_add_remove_users(mc: MinioAdmin):
    assert len(mc.list_users()) == 0
    mc.add_user("foo", "barbarbar")
    assert len(mc.list_users()) == 1

    foo = mc.get_user("foo")
    assert foo["accessKey"] == "foo"
    assert foo["userStatus"] == "enabled"

    mc.add_user("bar", "foofoofoo")
    assert len(mc.list_users()) == 2

    mc.remove_user("foo")
    mc.remove_user("bar")
    assert len(mc.list_users()) == 0


def test_enable_disable_users(mc: MinioAdmin):
    mc.add_user("foo", "barbarbar")
    assert mc.get_user("foo")["userStatus"] == "enabled"

    mc.disable_user("foo")
    assert mc.get_user("foo")["userStatus"] == "disabled"

    mc.enable_user("foo")
    assert mc.get_user("foo")["userStatus"] == "enabled"

    mc.remove_user("foo")


def test_add_remove_group(mc: MinioAdmin):
    assert len(mc.list_groups()) == 0
    mc.add_user("foo", "barbarbar")
    mc.group_add("pro", "foo")
    assert len(mc.list_groups()) == 1

    mc.add_user("bar", "foofoofoo")
    mc.add_user("abc", "defghijk")
    mc.group_add("pro", "bar", "abc")
    assert len(mc.list_groups()) == 1

    group = mc.get_group("pro")
    assert group["groupName"] == "pro"
    assert group["groupStatus"] == "enabled"
    assert len(group["members"]) == 3

    mc.group_remove("pro", "foo", "abc")
    assert len(mc.get_group("pro")["members"]) == 1

    mc.group_remove("pro", "bar")
    mc.group_remove("pro")
    assert len(mc.list_groups()) == 0

    mc.remove_user("abc")
    mc.remove_user("bar")
    mc.remove_user("foo")


def test_enable_disable_group(mc: MinioAdmin):
    mc.add_user("foo", "barbarbar")
    mc.group_add("abc", "foo")
    assert mc.get_group("abc")["groupStatus"] == "enabled"
    mc.disable_group("abc")
    assert mc.get_group("abc")["groupStatus"] == "disabled"
    mc.enable_group("abc")
    assert mc.get_group("abc")["groupStatus"] == "enabled"
    mc.remove_user("foo")
    mc.group_remove("abc")


def test_read_policy(mc: MinioAdmin):
    policies = mc.list_policies()
    assert len(policies) == 4
    for item in policies:
        policy = mc.get_policy(item["policy"])
        assert policy["policy"] == item["policy"]
        assert policy["policyJSON"]["Statement"]


def test_apply_policy(mc: MinioAdmin):
    readonly = readonly_buckets_policy("abc")
    readwrite_buckets = readwrite_buckets_policy("def", "ghi")
    readwrite = """
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["s3:*"],
                "Resource": ["arn:aws:s3:::*"]
            }]
        }"""

    with pytest.raises(ValueError):
        mc.set_policy("missing_argument")
    with pytest.raises(ValueError):
        mc.set_policy("too", "many", "arguments")

    mc.add_policy("reader", readonly)
    assert len(mc.list_policies()) == 5
    mc.add_policy("fullaccess", readwrite)
    assert len(mc.list_policies()) == 6
    mc.add_policy("rw", readwrite_buckets)
    assert len(mc.list_policies()) == 7

    mc.add_user("foo", "barbarbar")
    mc.group_add("yeet", "foo")
    mc.set_policy("reader", user="foo")
    assert mc.get_user("foo")["policyName"] == "reader"

    mc.set_policy("fullaccess", group="yeet")
    assert mc.get_group("yeet")["groupPolicy"] == "fullaccess"

    mc.remove_policy("fullaccess")
    assert "groupPolicy" not in mc.get_group("yeet")

    mc.remove_policy("reader")
    assert "policyName" not in mc.get_user("foo")

    mc.remove_policy("rw")
    mc.remove_user("foo")
    mc.group_remove("yeet")
    assert len(mc.list_policies()) == 4
