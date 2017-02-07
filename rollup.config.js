//import eslint from 'rollup-plugin-eslint';

export default {
	entry: 'src/cellr.js',

	format: 'umd',
	moduleName: 'cellr',

	dest: 'dst/cellr.js',

	plugins: [
		//eslint()
	]
};
