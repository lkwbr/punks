const GAME_WIDTH = 480
const GAME_HEIGHT = 270

const IMG_WIDTH = 8 * 10
const IMG_HEIGHT = 15 * 10

const USER_REFRESH_PERIOD = 10
//const DEFAULT_RENDER_MS = 700
const DEFAULT_RENDER_MS = 500
const NUM_FRAMES = 2 
//const BG_COLORS = ['#BB2528', '#165B33']
const BG_COLORS = ['#000', '#000']
const PARTICLE_CEILING = 50
const PARTICLE_FLOOR = 10
const SUNSET_COLORS = ['#36c2ff', '#36c2ff', '#005dec', '#1105bd', '#570079', '#000454', '#000454']

const SUNSET_SCENE_LENGTH = 20

const USERS = [
    'logan', 'ben', 'luke', 'josh', 'nick', 'rob', 'dee', 'blue',
    'emilia',
    'landon',
		'tree'
    // 'sun'
    //'janna', 'annie', 'lana', 'patrick', 'mikolas', 'burke', 'jordan'
]

function randomString(n) {
    n = n || 16
    let s = [...Array(n)].map(_ => {
        let c = String.fromCharCode(97 + Math.floor(26 * Math.random()))
        c = Math.random() > 0.5 ? c.toUpperCase() : c
        return c 
    }).join('')
    return s
}

const Game = {
    init() {
        // Resource fetching
        // const text = getText() 

        // Init ECS 
        Game.components = [] 
        Game.entities = {
            it: 0,
            render_period: DEFAULT_RENDER_MS,
            user_refresh_period: USER_REFRESH_PERIOD,
            // Randomly set starting user
            userId: Math.floor(Math.random() * USERS.length),
            paused: false,
            bg: '#fff',
            fg: null,
            images: Game.prefetchImages()  
        }
        Game.systems = [
            Game.userSystem,
            Game.snowSystem,
            Game.resizeSystem,
            Game.nightSystem,
            Game.sunsetSystem,
            Game.mountainSystem,
            Game.pauseSystem,
            Game.drawSystem,
            Game.cleanupSystem,
            Game.timeSystem,
        ]

        // Initialize canvas
        Game.canvas = document.getElementById('canvas')
        Game.ctx = Game.canvas.getContext('2d')

        // Request first frame
        /*
        Game.canvas.onload = () => {
						window.requestAnimationFrame(() => Game.update())
        }
        */
        window.requestAnimationFrame(() => Game.update())

				// Attach canvas listeners
				Game.canvas.addEventListener('mousedown', function (e) {
            Game.entities.paused = !Game.entities.paused
				}, false)
    }, 

    getCanvasDims() {
        return [Game.canvas.width, Game.canvas.height]
    },

    getCenterCoordinates() {
				return [Game.canvas.width / 2, Game.canvas.height / 2]
    },

    prefetchImages() {
        const NUM_FRAMES = 2
        return USERS.reduce((acc, key) => ({[key]: Game.getImages(key, NUM_FRAMES), ...acc}), {})
    },

    getImages(alias, count) {
        if (Game.entities?.images && Game.entities.images[alias]) { 
            return Game.entities.images[alias] 
        }
        if (!count) {
            const img = new Image()
            img.src = `res/${alias}.png`
            return [img]
        }
				const images = Array.from({ length: count }, (_, i) => new Image())
        images.forEach((x, i) => x.src = `res/${alias}_${i + 1}.png`)
        return images
    },

    getText() {
        /*
        fetch('/res/' + name + '.txt').then(response => response.text()).then(data => {
            console.log(data)

            document.title = name

            // Set initial mug and poem
            //document.getElementById('name').innerHTML = name;
            //document.getElementById('mug').src = 'res/' + name + '_' + it + '.png';
            //document.getElementById('poem').innerHTML = data;
            // Play background music on loop 
            let music = new Audio('music.mp3')
            music.loop = true
            music.muted = true
            // Play user voice
            voice = new Audio('res/' + name + '.mp3')
            voice.loop = true
            voice.muted = true
            // voice.play()
            //music.play()

            Game.motto = data

            // Animate the mug 
            Game.init()
            //Game.resize()
        })
        */
    },

    getComponent(id) {
        let foundComp = null
        Game.components.forEach(comp => foundComp = (comp.id == id) ? comp : foundComp)
        return foundComp
    },

    getComponents(group) {
        const foundComps = []  
        Game.components.forEach(comp => { if (comp.group == group) { foundComps.push(comp) } })
        return foundComps
    },

    createComponent(comp) {
        // Ensure that the ID is unique and the fields are correct for the type
        if (!comp.coor) {
            // Default coordinates to the center of the canvas
            comp.coor = Game.getCenterCoordinates()
        }
        comp.killable = (comp.killable === false) ? false : true
        comp.data = comp.data || {}
        comp.data.lifetime = 0
        if (Game.components.some(c => c.id == comp.id)) {
            throw new Error(`Comoponent ID "${comp.id}" is not unique!`)
        }
        Game.components.push(comp)
    },

    deleteComponent(id) {
        Game.components = Game.components.filter(x => x.id !== id)
    },

    sunsetSystem() {
        if (Game.entities.paused) { return }
        if (Game.entities.it > SUNSET_SCENE_LENGTH) { return }
        // Background
        const sunDiameter = 700
        const bgColorId = Math.floor((Game.entities.it / SUNSET_SCENE_LENGTH) * (SUNSET_COLORS.length - 1))
        Game.entities.bg = SUNSET_COLORS[bgColorId]
        if (Game.entities.it == 0) {
            // Spawn the sun at the top
            const dims = [sunDiameter, sunDiameter]
            const coor = [Game.getCenterCoordinates()[0], -sunDiameter/2]
            const sunImages = Game.getImages('sun', 2)
            Game.createComponent({
                img: sunImages[0],
                type: 'img',
                coor,
                dims,
                id: 'sun',
                data: {
                    imgs: sunImages,
                    it: 0
                },
                killable: false
            })
        } else {
            // Perform sunset steps
            const sunComp = Game.getComponent('sun')
            Game.updateComponentDims(sunComp, null, null, -40)
            const sunriseLength = Game.getCanvasDims()[1] + sunDiameter
            // NOTE:  0.90 because I want the sun to set before all colors are enumerated 
            const stepLength = sunriseLength / Math.floor(SUNSET_SCENE_LENGTH * 0.90) 
            sunComp.coor[1] += stepLength
        }
    },

    updateComponentDims(comp, w, h, r) {
        if (r) {
            w = comp.dims[0] + r
            h = comp.dims[1] + r
        }
        comp.dims = [w, h]
    },

    snowSystem() {
        const snowStartFrame = Math.floor(SUNSET_SCENE_LENGTH * 0.5)
        if (Game.entities.paused) { return }
        if (Game.entities.it < snowStartFrame) { return }

        const groupId = 'snowflakes'
        let snowflakes = Game.getComponents(groupId)

        // Spawn the snow
				const numSnowParticles = Math.min(Math.floor(Math.log(Game.entities.it)), 5)
				Array.from(Array(numSnowParticles)).forEach((x, i) => {
						let rnd = Math.random()
						let particleWidth = 5
						if (rnd < 0.05) {
							particleWidth = 20
						} else if (rnd < 0.25) {
							particleWidth = 10
						}
						const coor = [
                Math.floor(Math.random() * Game.canvas.width),
                0
            ]
            const dims = [particleWidth, particleWidth]
            Game.createComponent({
                type: 'rect',
                coor,
                dims,
                id: `snowflake_${randomString(6)}`,
                group: groupId,
                data: {
                    fill: '#fff'
                }
            })
				})

        // Render the snow
        Game.getComponents(groupId).forEach(snowflake => {
            snowflake.coor[0] += -1 ^ Math.floor(Math.random() * 2) * (Math.random() * 10)
            snowflake.coor[1] += Math.random() * 50 + Math.random() * 100
        })

        Game.entities.bg = '#000000'
    },

    nightSystem() {
        if (Game.entities.paused) { return }
        Game.entities.bg = '#000000'
    },

    mountainSystem() {
        const mountainStartFrame = Math.floor(SUNSET_SCENE_LENGTH)
        if (Game.entities.paused) { return }
        const MTN_TAG = 'mountains'
        let comp = Game.getComponent(MTN_TAG)
        if (!comp) {
            // Mountain genesis 
            const img = Game.getImages(MTN_TAG)[0]
            const scale = 15
            const dims = [img.width * scale, img.height * scale]
            const coor = Game.getCenterCoordinates()
            coor[1] = Game.getCanvasDims()[1] + 300 // dims[1] / 2
            Game.createComponent({
                img,
                type: 'img',
                coor,
                dims,
                id: MTN_TAG,
                killable: false
            })
        } else {
            // Mountain animation
            comp.coor[1] -= 30
            const scaleGrowth = 1.03
            comp.dims = [Math.floor(comp.dims[0] * scaleGrowth), Math.floor(comp.dims[1] * scaleGrowth)]
        }
    },

    userSystem() {
        const userStartFrame = SUNSET_SCENE_LENGTH + 10
        if (Game.entities.paused) { return }
        if (Game.entities.it < userStartFrame) { return }
				// Spawn the user
        const username = USERS[Game.entities.userId]
        const USER_TEXT_TAG = 'user_text'
        const USER_TAG = 'user'
        let comp = Game.getComponent(USER_TAG)
        if (!comp) {
            console.log('creating user', username)
            const images = Game.getImages(username, 2)
            const img = images[0]
            const dims = [img.width * 20, img.height * 20]
            const coor = Game.getCenterCoordinates()
            Game.createComponent({
                img,
                type: 'img',
                coor,
                dims,
                id: USER_TAG,
                data: {
                    imgs: images,
                    it: 0,
                    username
                }
            })
            const textCoor = [coor[0], coor[1] + dims[1] / 2 + 60]
            Game.createComponent({
                text: username.toUpperCase(),
                type: 'text',
                coor: textCoor,
                size: 40,
                id: USER_TEXT_TAG
            })
        }

        // User change
        if (Game.entities.it % Game.entities.user_refresh_period == 0) {
            Game.deleteComponent(USER_TAG)
            Game.deleteComponent(USER_TEXT_TAG)
            Game.entities.userId = (Game.entities.userId + 1) % USERS.length
        }


        // TODO:  Animate the image like so:

        /*
				if (Math.random() < 0.1) {
						// With a random probability, randomly flip the image
						Game.ctx.translate(centerX + imgWidth / 2, centerY - imgHeight / 2)
						Game.ctx.scale(-1, 1)
				} else {
						Game.ctx.translate(centerX - imgWidth / 2, centerY - imgHeight / 2)
			  }
				Game.ctx.drawImage(
						image,
						0, 0,
						//centerX - imgWidth / 2,
						//centerY - imgHeight / 2,
						imgWidth,
						imgHeight
				)
				// Reset transformations to normal just in case 
				Game.ctx.setTransform(1, 0, 0, 1, 0, 0)
        */

				// Draw the name
				/*
				Game.ctx.fillStyle = 'white';
				Game.ctx.font = '100px 'VT323', monospace'
				Game.ctx.fillText(name.toUpperCase(), centerX - 110, centerY - centerY / 2)
				*/
    },

    cleanupSystem() {
        Game.components.forEach(comp => {
            if (!comp.killable) {
                return
            }
            const x_dim = (comp.dims && comp.dims[0]) || 0
            const y_dim = (comp.dims && comp.dims[1]) || 0
            if ((comp.coor[0] - x_dim / 2) < 0 || 
                (comp.coor[1] - y_dim / 2) < 0 ||
                (comp.coor[0] + x_dim / 2) >= Game.canvas.width ||
                (comp.coor[1] + y_dim / 2) >= Game.canvas.height
            ) {
                Game.deleteComponent(comp.id)
            }
        })
    },

    drawSystem() {

        // TODO:  Remove items that should be deleted, because they're outside the canvas for too long, for example
        // TODO:  Probably give each component a lifespan

        // Draw background
        Game.ctx.fillStyle = Game.entities.bg
        Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)
        // Draw components
        Game.components.forEach(comp => {
            comp.data.lifetime += 1 
            if (comp.type == 'img') {
                let img = comp.img
                if (comp.data.imgs) {
                    img = comp.data.imgs[comp.data.it % comp.data.imgs.length]
                    comp.data.it += 1
                }
                Game.ctx.drawImage(
                    img,
                    comp.coor[0] - comp.dims[0] / 2,
                    comp.coor[1] - comp.dims[1] / 2,
                    comp.dims[0],
                    comp.dims[1]
                )
            } else if (comp.type == 'rect') {
                Game.ctx.fillStyle = comp.data.fill
                Game.ctx.fillRect(
                    comp.coor[0] - comp.dims[0] / 2,
                    comp.coor[1] - comp.dims[1] / 2,
                    comp.dims[0],
                    comp.dims[1]
                )
            } else if (comp.type == 'text') {
                Game.ctx.fillStyle = '#fff' 
                Game.ctx.textAlign = 'center'
                Game.ctx.font = `${comp.size}px Arcade Classic`
                Game.ctx.fillText(comp.text, comp.coor[0], comp.coor[1])
            }
        })        
        // Foreground
        if (Game.entities.fg) {
            Game.ctx.fillStyle = Game.entities.fg
            Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)
        }
    },

    resizeSystem() {
        if ((window.innerWidth == Game.canvas.width) 
            && (window.innerHeight == Game.canvas.height)) {
            return
        }
        // Adjust each entity for the new canvas size.
        const xShift = window.innerWidth / Game.canvas.width 
        const yShift = window.innerHeight / Game.canvas.height 
        Game.components.forEach(comp => {
            comp.coor[0] = comp.coor[0] * xShift
            comp.coor[1] = comp.coor[1] * yShift
        })
        // Update canvas
				Game.canvas.width = window.innerWidth
				Game.canvas.height = window.innerHeight
				Game.ctx.imageSmoothingEnabled = false
    },

    pauseSystem() {
        const PAUSE_TAG = 'pause'
        const comp = Game.getComponent(PAUSE_TAG)
        if (!Game.entities.paused) { 
            Game.entities.fg = null 
            if (comp) { 
                Game.deleteComponent(PAUSE_TAG)
            }
        } else {
            Game.entities.fg = 'rgba(255, 255, 255, 0.5)' 
            if (!comp) {
                Game.createComponent({
                    text: '\u25B6 ',
                    type: 'text',
                    size: 60,
                    id: PAUSE_TAG 
                })
            }
        }
    },

    userSpeakSystem() {
        if (game.entities.paused) { return }

				var msg = new SpeechSynthesisUtterance()
				msg.text = Game.motto 
				window.speechSynthesis.speak(msg)
    },

    timeSystem() {
				Game.entities.it += 1
        // Speed up render period
        Game.entities.render_period = Math.max(Game.entities.render_period - 5, 200)
    },

		update() {
        console.log('Game.entities.it:', Game.entities.it)
        Game.systems.forEach(s => s())
			  setTimeout(
            () => window.requestAnimationFrame(Game.update), 
            Game.entities.render_period
        )
		}
}

window.onload = Game.init
