// Configuration for esgettext, created by esgettext v1.3.1.
export default {
	package: {
		name: '@esgettext/tools',
		version: '1.3.1',
		textdomain: 'com.cantanea.esgettext-tools',
		'msgid-bugs-address': 'https://github.com/gflohr/esgettext/issues',
	},
	po: { directory: 'po', locales: ['de', 'en-AU', 'en-CA', 'en-GB', 'en-NZ'] },
	install: { directory: 'src/locale' },
	programs: {
		msgmerge: { options: ['update', 'previous'] },
		msgfmt: { options: ['check', 'statistics', 'verbose'] },
	},
};
