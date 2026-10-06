// Conventional Commits; header fino a 120 caratteri invece dei 100 di config-conventional
export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'header-max-length': [2, 'always', 120],
	},
};
