import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('hello-world');
gtx.bindtextdomain('./assets');
gtx
	.resolve()
	.then(() => {
		console.log(gtx._('Hello, world!'));
	})
	.catch(error => {
		console.error(`could not resolve textdomain: ${error}`);
	});
