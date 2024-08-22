module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
	  'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'test']],
	  'subject-empty': [2, 'never'],
	  'scope-empty': [2, 'never'],
	  'subject-full-stop': [2, 'never', '.'],
	  'subject-max-length': [2, 'always', 50],
	  'scope-max-length': [2, 'always', 50],
	},
};