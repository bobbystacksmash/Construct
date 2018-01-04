const path = require('path');

module.exports = {
    entry: './src/index.js',
    target: "node",
    output: {
        filename: 'construct.js',
        path: path.resolve(__dirname, 'dist')

    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    }
};
