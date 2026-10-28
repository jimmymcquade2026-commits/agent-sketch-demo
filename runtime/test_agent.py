import tempfile
import unittest
from pathlib import Path
from agent import run, response_text, validate_config

class AgentTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / 'runs.db'
        self.config = {'format':'agentsketch-agent-v1','name':'Test','instructions':'Prepare a response for review.'}
    def tearDown(self): self.tmp.cleanup()
    def test_duplicate_avoids_provider(self):
        calls=[]
        def provider(c,t): calls.append(t); return 'Draft'
        self.assertEqual(run(self.config,'Example inquiry',self.db,provider), ('Draft',False))
        self.assertEqual(run(self.config,'Example inquiry',self.db,provider), ('Draft',True))
        self.assertEqual(len(calls),1)
    def test_failure_is_not_retried(self):
        def fail(c,t): raise ValueError('timeout')
        with self.assertRaises(ValueError): run(self.config,'Example',self.db,fail)
        with self.assertRaisesRegex(ValueError,'pending or failed'): run(self.config,'Example',self.db,fail)
    def test_invalid_input_never_calls_provider(self):
        with self.assertRaises(ValueError): run(self.config,' ',self.db,lambda *_:self.fail())
    def test_response_parses_all_text(self):
        self.assertEqual(response_text({'status':'completed','output':[{'type':'reasoning'},{'type':'message','content':[{'type':'output_text','text':'a'},{'type':'output_text','text':'b'}]}]}),'a\nb')
    def test_incomplete_response_rejected(self):
        with self.assertRaises(ValueError): response_text({'status':'incomplete','output':[]})
    def test_invalid_config(self):
        with self.assertRaises(ValueError): validate_config({'name':'wrong'})
if __name__=='__main__': unittest.main()
