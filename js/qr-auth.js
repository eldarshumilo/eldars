window.qrAuth = {
    CONNECTION: null,
    SID: null,
    AUTH_SERVER_URL: 'https://ai.sqilsoft.by/dts',
    generateQR(qrSetCallback, setTokenCallback) {
        if (this.CONNECTION !== null) {
            return
        }
        this.CONNECTION = io('https://ai.sqilsoft.by', {
            path: '/dts/ws/socket.io',
            transports: ['websocket']
        })

        this.CONNECTION.on('connect', async () => {
            console.log('Connected')
            const response = await fetch(`${this.AUTH_SERVER_URL}/${this.CONNECTION.id}/qr-generate/`)
            if (response.status === 200) {
                const responseData = await response.json()
                qrSetCallback(responseData.image)
            }
        });
        this.CONNECTION.on('auth', (data) => {
            try {
                setTokenCallback(JSON.parse(data))
            } catch (SyntaxError) {
                console.error('Cannot parse')
            }
            this.CONNECTION.disconnect()
            this.CONNECTION = null
            this.SID = null
        })
    },
}