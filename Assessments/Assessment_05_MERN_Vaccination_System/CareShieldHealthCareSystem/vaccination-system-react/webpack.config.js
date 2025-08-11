const path = require('path'); // Node.js module to resolve paths
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Plugin to inject bundle into HTML
const webpack = require('webpack'); // Webpack core, needed for DefinePlugin if used for other vars
const Dotenv = require('dotenv-webpack'); // Plugin to load .env files

module.exports = (env, argv) => { // Use function to access env and argv if needed for mode etc.
    const isDevelopment = argv.mode === 'development'; // Determine if in development mode

    return {
        // Entry point of your application
        entry: './src/index.js',

        // Output configuration for the bundled files
        output: {
            path: path.resolve(__dirname, 'dist'), // Absolute path to the output directory
            filename: 'bundle.js', // Name of the main bundled JavaScript file
            publicPath: '/', // Base path for all assets, crucial for React Router to work correctly on refresh
        },

        // Development server configuration
        devServer: {
            static: {
                directory: path.join(__dirname, 'public'), // Serve static files from the public directory
            },
            port: 3000, // Port for the development server to run on
            historyApiFallback: true, // Fallback to index.html for HTML5 history API (React Router)
            open: true, // Open the browser automatically when the server starts
            hot: true, // Enable Hot Module Replacement (HMR) for faster development
        },

        // Define how different types of modules are treated
        module: {
            rules: [
                {
                    // Rule for JavaScript and JSX files
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/, // Exclude node_modules for faster compilation
                    use: {
                        loader: 'babel-loader', // Use Babel to transpile JS/JSX
                        options: {
                            presets: [
                                '@babel/preset-env', // Transpile modern JavaScript to compatible versions
                                '@babel/preset-react', // Transpile JSX into React.createElement calls
                            ],
                            // Add plugins if you use specific Babel features (e.g., class properties)
                            // plugins: [...]
                        },
                    },
                },
                {
                    // Rule for CSS files
                    test: /\.css$/,
                    // 'style-loader' injects CSS into the DOM, 'css-loader' interprets @import and url()
                    use: ['style-loader', 'css-loader'],
                },
                {
                    // Rule for images (e.g., .png, .jpg, .gif, .svg)
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    type: 'asset/resource', // Webpack 5 asset module type
                    generator: {
                        filename: 'images/[name].[hash][ext]', // Output filename for images
                    },
                },
                {
                    // Rule for fonts (e.g., .woff, .woff2, .ttf, .eot)
                    test: /\.(woff|woff2|ttf|eot)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash][ext]', // Output filename for fonts
                    },
                },
            ],
        },

        // Plugins to extend Webpack's capabilities
        plugins: [
            // Injects the bundled JavaScript into your HTML file
            new HtmlWebpackPlugin({
                template: './public/index.html', // Source HTML file
                filename: 'index.html', // Output HTML file name
            }),
            // This plugin loads variables from your .env file and makes them available
            // as process.env.YOUR_VAR in your client-side code.
            // It replaces 'process.env.REACT_APP_API_URL' directly with its string value.
            new Dotenv({
                path: './.env', // Path to your .env file
                safe: true, // Load .env.example (if it exists)
                allowEmptyValues: true, // Allow empty variables in .env
                systemvars: true, // Allow environment variables from your system to override .env
                silent: true, // Suppress warnings
                defaults: false, // Load .env.defaults (if it exists)
            }),
            // OPTIONAL: Use DefinePlugin only if you need to define *other* global constants
            // that are NOT sourced from your .env file (as Dotenv handles those).
            // Example for a separate build variable:
            // new webpack.DefinePlugin({
            //     '__APP_VERSION__': JSON.stringify('1.0.0'),
            //     '__DEBUG_MODE__': JSON.stringify(isDevelopment),
            // }),
            // No need to define process.env.REACT_APP_API_URL here, Dotenv handles it.
        ],

        // Configure module resolution
        resolve: {
            // Allows you to import modules without specifying their extensions
            extensions: ['.js', '.jsx'],
            // You can also add aliases here for easier imports, e.g.,
            // alias: {
            //     '@components': path.resolve(__dirname, 'src/components/'),
            // },
        },

        // Source maps for easier debugging in development
        devtool: isDevelopment ? 'eval-source-map' : 'source-map',
        // 'eval-source-map' is good for dev, faster. 'source-map' is for production.
    };
};