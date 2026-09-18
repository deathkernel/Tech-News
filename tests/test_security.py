import pytest

from app.main import is_safe_remote_url


def test_rejects_localhost():
    assert is_safe_remote_url("http://localhost/") is False


def test_rejects_loopback_ipv4():
    assert is_safe_remote_url("http://127.0.0.1/") is False


def test_rejects_private_ipv4():
    assert is_safe_remote_url("http://10.0.0.1/") is False


def test_rejects_non_http_scheme():
    assert is_safe_remote_url("file:///etc/passwd") is False


def test_rejects_unapproved_port():
    assert is_safe_remote_url("http://127.0.0.1:8080/") is False
