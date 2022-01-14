const GAME_WIDTH = 480
const GAME_HEIGHT = 270

const IMG_WIDTH = 8 * 10
const IMG_HEIGHT = 15 * 10

const USER_REFRESH_PERIOD = 10
const DEFAULT_RENDER_MS = 5000
const NUM_FRAMES = 2 
//const BG_COLORS = ['#BB2528', '#165B33']
const BG_COLORS = ['#000', '#000']
const PARTICLE_CEILING = 50
const PARTICLE_FLOOR = 10
const SUNSET_COLORS = ['#36c2ff', '#005dec', '#1105bd', '#570079', '#000454', '#000']

const USERS = [
    'logan', 'ben', 'luke', 'josh', 'nick', 'rob', 'dee', 'blue',
    'emilia',
    'landon',
		'tree', 'sun'
    //'janna', 'annie', 'lana', 'patrick', 'mikolas', 'burke', 'jordan'
]

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
            bg: '#fff'
        }
        Game.systems = [
            /*
            Game.snowSystem, 
            Game.nightSystem, 
            Game.pauseSystem,
            Game.drawUserSystem, 
            Game.changeUserSystem,
            Game.canvasSizeSystem,
            */
            Game.resizeSystem,
            Game.sunsetSystem, 
            Game.drawSystem, 
            Game.clockSystem 
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

    changeUserSystem() {
        if (game.entities.paused) { return }

        // User change
        if (Game.entities.it % Game.entities.user_refresh_period == 0) {
            Game.entities.userId = (Game.userId + 1) % USERS.length
        }

        return getImages(USERS[Game.userId], NUM_FRAMES)
    },

    getCenterCoordinates() {
				return [Game.canvas.width / 2, Game.canvas.height / 2]
    },

    getImages(alias, count) {
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
        Game.components.forEach(comp => foundComp = (comp.id == id) ? comp : null)
        if (!foundComp) { throw Exception() }
        return foundComp
    },

    createComponent() {
        // Ensure that the id is unique and the fields are correct for the type
    },

    sunsetSystem() {
        const sceneLength = 20
        if (Game.entities.paused) { return }
        if (Game.entities.it > sceneLength) { return }

        // Background
        const bgColorId = Math.floor((Game.entities.it / sceneLength) * SUNSET_COLORS.length)
        Game.entities.bg = SUNSET_COLORS[bgColorId]

        if (Game.entities.it == 0) {
            // Create the sun component
            const dims = [300, 300]
            const coor = Game.getCenterCoordinates()
            coor[0] -= dims[0] / 2
            coor[1] -= dims[1] / 2
            const sunImages = Game.getImages('sun', 2)
            const sunComp = {
                img: sunImages[0],
                type: 'img',
                coor,
                dims,
                id: 'sun',
                data: {
                    imgs: sunImages,
                    it: 0
                }
            }
            Game.components.push(sunComp)
        } else {
            const sunComp = Game.getComponent('sun')
            sunComp.coor[1] += 20
            console.log('sunComp', sunComp)
        }
    },

    snowSystem() {
        if (game.entities.paused) { return }

				// Draw the snow
				const numSnowParticles = Math.floor((PARTICLE_CEILING - PARTICLE_FLOOR) * Math.random()) + PARTICLE_FLOOR
				Game.ctx.fillStyle = '#fff'
				Array.from(Array(numSnowParticles)).forEach((x, i) => {
						let rnd = Math.random()
						let particleWidth = 10
						if (rnd < 0.1) {
							particleWidth = 20
						} else if (rnd < 0.25) {
							particleWidth = 5
						}
						Game.ctx.fillRect(
								Math.floor(Math.random() * Game.canvas.width),
								Math.floor(Math.random() * Game.canvas.height),
								particleWidth,
								particleWidth
						)
				})
    },

    nightSystem() {
        if (game.entities.paused) { return }

				// Draw the background
				Game.ctx.fillStyle = BG_COLORS[Game.entities.it % BG_COLORS.length]
				Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)
    },

    userDrawSystem() {
        if (game.entities.paused) { return }

				// Draw the person
				const image = Game.images[Game.entities.it % NUM_FRAMES]
        const [centerX, centerY] = Game.getCenterCoordinates()
				const imgWidth = image.width * 20
				const imgHeight = image.height * 20

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

				// Draw the name
				/*
				Game.ctx.fillStyle = 'white';
				Game.ctx.font = '100px 'VT323', monospace'
				Game.ctx.fillText(name.toUpperCase(), centerX - 110, centerY - centerY / 2)
				*/
    },

    drawSystem() {
        // Draw background
        Game.ctx.fillStyle = Game.entities.bg
        Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)
        // Draw components
        Game.components.forEach(comp => {
            if (comp.type == 'img') {
                Game.ctx.drawImage(
                    comp.img,
                    comp.coor[0],
                    comp.coor[1],
                    comp.dims[0],
                    comp.dims[1]
                )
            } else if (comp.type == 'rect') {
                //
            }
        })        
    },

    // TODO
    resizeSystem() {
        if ((window.innerWidth == Game.canvas.width) 
            && (window.innerHeight == Game.canvas.height)) {
            return
        }

        // Adjust each entity for the new canvas size.
        const xShift = window.innerWidth / Game.canvas.width 
        const yShift = window.innerHeight / Game.canvas.height 
        console.log('xshift', xShift, 'yshift', yShift)
        Game.components.forEach(comp => {
            console.log('before', comp.coor)
            comp.coor[0] = (comp.coor[0] + comp.dims[0] / 2) * xShift - comp.dims[0] / 2
            comp.coor[1] = (comp.coor[1] + comp.dims[1] / 2) * xShift - comp.dims[1] / 2
            console.log('after', comp.coor)
        })

        // Update canvas
				Game.canvas.width = window.innerWidth
				Game.canvas.height = window.innerHeight
				Game.ctx.imageSmoothingEnabled = false
    },

		pauseSystem() {
        if (!game.entities.paused) { return }

				// Draw the background
				Game.ctx.fillStyle = '#ffffff'
				Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)

				const centerX = Game.canvas.width / 2
				const centerY = Game.canvas.height / 2

				// Draw the name
				Game.ctx.fillStyle = 'black'
				Game.ctx.font = '100px "VT323", monospace'
				Game.ctx.fillText('PAUSED', centerX - 110, centerY)
	  },

    userSpeakSystem() {
        if (game.entities.paused) { return }

				var msg = new SpeechSynthesisUtterance()
				msg.text = Game.motto 
				window.speechSynthesis.speak(msg)
    },

    clockSystem() {
				Game.entities.it += 1
    },

		update() {
        console.log('Game.entities.it:', Game.entities.it)
        Game.systems.forEach(s => s())
			  setTimeout(
            () => window.requestAnimationFrame(() => Game.update()), 
            Game.entities.render_period
        )
		}
}

window.onload = Game.init
