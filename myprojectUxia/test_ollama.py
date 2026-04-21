import ollama

client = ollama.Client(host='http://192.168.1.24:11434')

# we'll test without image first to ensure it connects and replies
response = client.chat(
    model='qwen3-vl:30b',
    messages=[{
        'role': 'user',
        'content': 'Dona\'m 3 etiquetes curtes.'
    }]
)
print(response['message']['content'])
