"""AgentSketch local AI assistant. Python 3.10+; no dependencies.
Run: python agent.py agent.json input.txt
Set OPENAI_API_KEY and OPENAI_MODEL in your environment first.
Input is sent to OpenAI only when you run this command. API usage may cost money.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import sys
import urllib.error
import urllib.request

ENDPOINT = 'https://api.openai.com/v1/responses'

def validate_config(config):
    if not isinstance(config, dict) or config.get('format') != 'agentsketch-agent-v1':
        raise ValueError('Choose an AgentSketch runnable agent JSON file.')
    for key in ('name', 'instructions'):
        if not isinstance(config.get(key), str) or not config[key].strip():
            raise ValueError('Agent is missing ' + key)
    if len(config['instructions']) > 20000:
        raise ValueError('Agent instructions are too long.')
    return config

def response_text(payload):
    if payload.get('status') != 'completed':
        raise ValueError('AI response did not complete; no result saved. Review provider usage before retrying.')
    text = '\n'.join(part['text'] for item in payload.get('output', [])
                     if item.get('type') == 'message' for part in item.get('content', [])
                     if part.get('type') == 'output_text' and isinstance(part.get('text'), str))
    if not text.strip():
        raise ValueError('The model returned no text. No result saved.')
    return text

def generate(config, text, key, model):
    body = json.dumps({'model': model, 'instructions': config['instructions'],
                       'input': text, 'store': False, 'max_output_tokens': 2000}).encode()
    req = urllib.request.Request(ENDPOINT, data=body,
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return response_text(json.load(response))
    except urllib.error.HTTPError as error:
        raise ValueError(f'AI provider returned HTTP {error.code}. Check account access and usage limits; no automatic retry.') from None
    except (urllib.error.URLError, TimeoutError):
        raise ValueError('Provider connection failed or timed out. Completion is uncertain; check provider usage before retrying.') from None

def run(config, text, database, provider):
    validate_config(config)
    if not isinstance(text, str) or not text.strip() or len(text) > 20000:
        raise ValueError('Provide between 1 and 20,000 characters of input.')
    identity = hashlib.sha256(json.dumps([config, text.strip()], sort_keys=True).encode()).hexdigest()
    with sqlite3.connect(database, timeout=10) as db:
        db.execute('CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, state TEXT NOT NULL, output TEXT)')
        try:
            db.execute('INSERT INTO runs VALUES (?, ?, NULL)', (identity, 'running'))
            db.commit()
        except sqlite3.IntegrityError:
            state, output = db.execute('SELECT state, output FROM runs WHERE id=?', (identity,)).fetchone()
            if state == 'completed':
                return output, True
            raise ValueError('This input already has a pending or failed run. Review it before starting another paid request.')
        try:
            output = provider(config, text)
            db.execute('UPDATE runs SET state=?, output=? WHERE id=?', ('completed', output, identity))
            db.commit()
            return output, False
        except Exception:
            db.execute('UPDATE runs SET state=? WHERE id=?', ('needs_review', identity))
            db.commit()
            raise

def main():
    parser = argparse.ArgumentParser(description='Run your AgentSketch AI assistant on a text file.')
    parser.add_argument('agent', type=Path)
    parser.add_argument('input', type=Path)
    parser.add_argument('--database', type=Path, default=Path('agentsketch-runs.sqlite3'))
    args = parser.parse_args()
    key, model = os.getenv('OPENAI_API_KEY'), os.getenv('OPENAI_MODEL')
    if not key or not model:
        parser.error('Set OPENAI_API_KEY and OPENAI_MODEL in your environment. Never put keys in agent.json.')
    try:
        config = validate_config(json.loads(args.agent.read_text(encoding='utf-8')))
        result, reused = run(config, args.input.read_text(encoding='utf-8'), args.database,
                             lambda c, t: generate(c, t, key, model))
        print(('Saved result (no new API call)' if reused else 'AI result — review before use') + '\n\n' + result)
    except (ValueError, OSError, sqlite3.Error) as error:
        print('Agent stopped: ' + str(error), file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
