// webpack.config.js

const path = require('path'); // Node.js path module for resolving paths

module.exports = {
    // 1. Entry point of your application
    entry: './src/index.js', // This should point to your main React entry file

    // 2. Output configuration for the bundled files
    output: {
        path: path.resolve(__dirname, 'dist'), // Output directory (e.g., 'dist' folder in your frontend root)
        filename: 'bundle.js', // Name of the bundled JavaScript file
        publicPath: '/', // Needed for React Router and proper asset serving in development
    },

    // 3. Module rules: This is where you tell Webpack how to handle different file types
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/, // Apply this rule to files ending with .js or .jsx
                exclude: /node_modules/, // Don't process files in node_modules
                use: {
                    loader: 'babel-loader', // Use babel-loader
                    // You can optionally put Babel options here too,
                    // but it's cleaner if they're in .babelrc as you have it.
                    // options: {
                    //     presets: ['@babel/preset-env', '@babel/preset-react'],
                    // },
                },
            },
            {
                test: /\.css$/, // Rule for CSS files
                use: ['style-loader', 'css-loader'], // Use style-loader and css-loader
            },
            // You might need rules for images, fonts, etc. depending on your project
            // {
            //   test: /\.(png|svg|jpg|jpeg|gif)$/i,
            //   type: 'asset/resource',
            // },
        ],
    },

    // 4. Resolve extensions: Allows you to import .js and .jsx files without specifying the extension
    resolve: {
        extensions: ['.js', '.jsx'],
    },

    // 5. Development server configuration (if you're using webpack-dev-server)
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'), // Serve static files from 'public'
        },
        compress: true, // Enable gzip compression
        port: 3000, // Your desired development port
        open: true, // Open browser automatically
        historyApiFallback: true, // Crucial for React Router (serves index.html for any path)
    },

    // 6. Source maps for debugging
    devtool: 'eval-source-map', // Or 'source-map' for production

    // 7. Stats configuration (which you already have)
    stats: {
        children: true,
        errorDetails: true,
        colors: true,
        errors: true,
        errorStack: true,
        warnings: true,
    },

    // 8. Mode (important for Webpack optimizations)
    mode: 'development', // Or 'production'
};