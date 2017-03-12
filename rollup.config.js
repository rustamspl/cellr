//import eslint from 'rollup-plugin-eslint';

export default {
	entry: 'src/app.js',

	format: 'iife',
	moduleName: 'app',

	dest: 'dst/app.js',

	plugins: [
		//eslint()
	]
};
