from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes
import base64

def pad(data, block_size):
    padding = block_size - len(data) % block_size
    return data + bytes([padding] * padding)

def encrypt_credential_value_with_publickey(public_key_pem, credentials):
    public_key = RSA.import_key(public_key_pem)
    rsa_cipher = PKCS1_OAEP.new(public_key, hashAlgo=SHA256)
    aes_key = get_random_bytes(32)  # AES-256 키 생성

    encrypted_credentials = {}
    for k, v in credentials.items():
        aes_cipher = AES.new(aes_key, AES.MODE_CBC)
        iv = aes_cipher.iv
        ciphertext = aes_cipher.encrypt(pad(v.encode(), AES.block_size))
        encrypted_credentials[k] = base64.b64encode(iv + ciphertext).decode()

    encrypted_aes_key = base64.b64encode(rsa_cipher.encrypt(aes_key)).decode()
    del aes_key  # 메모리에서 AES 키 삭제

    return encrypted_credentials, encrypted_aes_key

# 제공된 RSA 공개키
public_key_pem = """-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEA415uxrQbwA+6AGtDbMKhzuGYTUF6wVL3cFtN6Axti2sgEGC3se0y
OwRYDi00yhCWXsII114yxRdaLG4hRnd6xDDCh6e1xvkg2uU58J9h/tuzwPzTcJz4
QoLcmqNHToMWnj3tTj///4HeUwtFbN9ZRy+VNUlXbXpMDXEPUuEgmI+zr0PCJm/3
Modks6vqa9vIimpqgJKzGjHDtqaHZ34tvvVfX5TtOsSmPR2r0A5cc7Tps6r8VVVF
CxNbFn2CfuNK9huxbbrP9W3jgQHvisWvrRLxs/X3gQVGk3OhZvJPIZDm6ET9+B+C
npHtogkzr3QvI8h2iLWMuVdV+n1yJOui1jXBbCBir9PmpH9Fb0drSdcpx7p+lUCs
ItLh+k/ik+hUEJSK/V1INniEMP9fIr9qq6vVc+zhccw+r+i8b/kS/XvJiTWTaq6u
JOuu2reJlDHWPCfkk6vjK2ibzh+DkgHc/TcWJ7d00V8hBPN3/npFSoYppr+nEFwC
jGr7yKPJUb8GOGj7ntS86SoUJxbbMwFW1omLRyybP793SlGSB9T81KNSvE7OHS7U
qdlyLi19dDEuSnNRnPZQubnE8w5U9RoxaMQ/0IyMXEWkHU3+X9Lbd0nfTwpy08YA
Okr1aV7zndYXBgh4OGKI/axsC6r3NOXBarMuHu8ouGlsaNjZE7IMoikCAwEAAQ==
-----END RSA PUBLIC KEY-----"""

# 테스트용 credentials 데이터
test_credentials = {
    "username": "testuser",
    "password": "testpassword123",
    "api_key": "sk-1234567890abcdef",
    "secret_key": "secret123456789"
}

print("=== 암호화 테스트 ===")
print("원본 credentials:")
for key, value in test_credentials.items():
    print(f"  {key}: {value}")

print("\n암호화 중...")
encrypted_credentials, encrypted_aes_key = encrypt_credential_value_with_publickey(public_key_pem, test_credentials)

print("\n=== 암호화 결과 ===")
print("암호화된 AES 키:")
print(encrypted_aes_key)

print("\n암호화된 credentials:")
for key, value in encrypted_credentials.items():
    print(f"  {key}: {value}")

print(f"\n총 {len(encrypted_credentials)} 개의 credentials가 암호화되었습니다.") 