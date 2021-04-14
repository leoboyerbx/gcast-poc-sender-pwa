module.exports = {
    devServer: {
        port: 3000,
        disableHostCheck: true
    },
    publicPath: process.env.NODE_ENV === 'production'
        ? '/app/'
        : '/'

}
