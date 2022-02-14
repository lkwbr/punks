const GAME_WIDTH = 480
const GAME_HEIGHT = 270

const IMG_WIDTH = 8 * 10
const IMG_HEIGHT = 15 * 10

const USER_REFRESH_PERIOD = 15
//const DEFAULT_RENDER_MS = 700
const DEFAULT_RENDER_MS = 500
const NUM_FRAMES = 2 
//const BG_COLORS = ['#BB2528', '#165B33']
const BG_COLORS = ['#000', '#000']
const PARTICLE_CEILING = 50
const PARTICLE_FLOOR = 10
const SUNSET_COLORS = ['#36c2ff', '#36c2ff', '#005dec', '#1105bd', '#570079', '#000454']

const SPEED = 1

const MUSIC_EVENTS = [0, 15, 30, 44, 350] // TODO

const USERS = [
    'logan', 'ben', 'luke', 'josh', 'nick', 'rob', 'dee', 'blue',
    //'emilia',
    //'landon',
		//'tree'
    //'sun'
    //'janna', 'annie', 'lana', 'patrick', 'mikolas', 'burke', 'jordan'
]
const ASSETS = USERS.concat(['mountains'])

function randomString(n) {
    n = n || 16
    let s = [...Array(n)].map(_ => {
        let c = String.fromCharCode(97 + Math.floor(26 * Math.random()))
        c = Math.random() > 0.5 ? c.toUpperCase() : c
        return c 
    }).join('')
    return s
}

function fileExists(url) {
    var http = new XMLHttpRequest();
    try {
        http.open('HEAD', url, false);
        http.send()
    } catch {
        return false
    }
    return http.status != 404
}

function createGradient(ctx, angleA, angleB) {
    var gr = ctx.createLinearGradient(0, 0, 500, 0);          // create gradient
    gr.addColorStop(0, "hsl(" + (angleA % 360) + ",100%, 50%)");   // start color
    gr.addColorStop(1, "hsl(" + (angleB % 360) + ",100%, 50%)");   // end color
    return gr                                                      // set as fill style
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
            paused: true,
            bg: '#fff',
            fg: null,
            images: Game.prefetchImages(),
            speed: SPEED
        }
        Game.systems = [
            Game.userSystem,
            Game.snowSystem,
            Game.resizeSystem,
            Game.nightSystem,
            Game.sunsetSystem,
            Game.mountainSystem,
            Game.creditSystem,
            Game.maskSystem,
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
        console.log('assets', typeof(ASSETS))
        return ASSETS.reduce((acc, key) => ({[key]: Game.getImages(key, NUM_FRAMES), ...acc}), {})
    },

    getImages(alias, count) {
        // Attempt lookup of prefetched images
        if (Game.entities?.images && Game.entities.images[alias]) { 
            return Game.entities.images[alias] 
        }
        if (fileExists(`res/${alias}.png`)) {
            // Just one instance of the alias exists
            const img = new Image()
            img.src = `res/${alias}.png`
            return [img]
        }
        // More than one instance may exist
        const images = []
        let i = 0
        while (true) {
            const url = `res/${alias}_${i + 1}.png`
            if (fileExists(url)) {
                const img = new Image()
                img.src = url 
                images.push(img)
            } else {
                break
            }
            i++
        }    
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
				if (comp.type == 'audio') {
            // Default audio to playing
						comp.playing = comp.playing || true
            comp.audio.playbackRate = Game.entities.speed
            comp.audio.loop = false
            comp.audio.addEventListener('ended', function() {
                this.currentTime = 0
                this.stop()
            }, false)
				}
        if (comp.coor.length == 2) {
            // Enforce component z-axis 
            comp.coor = comp.coor.concat([0])
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
        console.log('delete.id', id)
        Game.components = Game.components.filter(x => x.id !== id)
    },

    sunsetSystem() {
        const SUNSET_START_FRAME = MUSIC_EVENTS[1]
        const SUNSET_END_FRAME = MUSIC_EVENTS[2] + 5
        const SUNSET_SCENE_LENGTH = SUNSET_END_FRAME - SUNSET_START_FRAME
        if (Game.entities.paused) { return }
        if (Game.entities.it < SUNSET_START_FRAME) { return }
        if (Game.entities.it > SUNSET_END_FRAME) { return }
        // Background
        const sunDiameter = 700
        const bgColorId = Math.floor(((Game.entities.it - MUSIC_EVENTS[1]) / SUNSET_SCENE_LENGTH) * (SUNSET_COLORS.length - 1))
        Game.entities.bg = SUNSET_COLORS[bgColorId]
        const sunComp = Game.getComponent('sun')
        if (!sunComp) {
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
        const snowStartFrame = Math.floor(MUSIC_EVENTS[2] * 0.5)
        if (Game.entities.paused) { return }
        if (Game.entities.it < MUSIC_EVENTS[1]) { return }
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
        if (Game.entities.it < MUSIC_EVENTS[1]) { return }
        Game.entities.bg = '#000000'
    },

    creditSystem() {
        const CREDIT_END_FRAME = MUSIC_EVENTS[3] - 2
        if (Game.entities.paused) { return }
        const INTRO_TEXT_TAG = 'intro_text' 
        let comp = Game.getComponent(INTRO_TEXT_TAG)

        if (!comp) {
            Game.createComponent({
                text: 'WEBER\nPUNKS',
                type: 'text',
                size: 120,
                coor: Game.getCenterCoordinates().concat([1]),
                color: 'rgba(255, 255, 255, 255)', 
                id: INTRO_TEXT_TAG
            })
        } else {

            if (Game.entities.it < MUSIC_EVENTS[2] + 5) { return }
            const opacity = 1
            const CHANGE_FACTOR = 40 
            comp.color = createGradient(
                Game.ctx,
                (Game.entities.it * CHANGE_FACTOR) % 360, 
                (Game.entities.it * CHANGE_FACTOR + 270) % 360
            )
        }
        if (Game.entities.it >= CREDIT_END_FRAME) {
            // Delete credits
            Game.deleteComponent(INTRO_TEXT_TAG)
        }
    },

    mountainSystem() {
        if (Game.entities.paused) { return }
        if (Game.entities.it < MUSIC_EVENTS[1]) { return }
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
            console.log('mountain--', comp.coor, Game.getCenterCoordinates())
            comp.coor[1] -= 30
            const scaleGrowth = 1.03
            comp.dims = [Math.floor(comp.dims[0] * scaleGrowth), Math.floor(comp.dims[1] * scaleGrowth)]
        }
    },

    userSystem() {
        const userStartFrame = MUSIC_EVENTS[3] // SUNSET_SCENE_LENGTH + 30
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

    maskSystem() {
        const MASK_TAG = 'fg-mask'
        const canvasDims = Game.getCanvasDims()
        const maxSize = 2 * Math.sqrt(2) * canvasDims[0]/2
        let size
        const numRadiusSteps = 25
        const radiusStepSize = maxSize / numRadiusSteps 
        if (Game.entities.it < MUSIC_EVENTS[1]) {
            size = 0
        } else if (Game.entities.it < MUSIC_EVENTS[3]) {
            size = (Game.entities.it - MUSIC_EVENTS[1]) * radiusStepSize
        } else if (Game.entities.it > MUSIC_EVENTS.at(-1) - numRadiusSteps) {
            size = Math.max(0, maxSize - radiusStepSize * (Game.entities.it - MUSIC_EVENTS.at(-1)))
        } else {
            size = maxSize 
        }
        let comp = Game.getComponent(MASK_TAG)
        if (!comp) {
            const coor = Game.getCenterCoordinates()
            Game.createComponent({
                type: 'mask',
                coor,
                size,
                id: MASK_TAG
            })
        } else {
            comp.size = size 
        }
    },

    drawSystem() {

        // TODO:  Remove items that should be deleted, because they're outside the canvas for too long, for example
        // TODO:  Probably give each component a lifespan  

        // Draw background
        Game.ctx.fillStyle = Game.entities.bg
        Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height)
        console.log('...', Game.components)
        Game.components.sort((a, b) => a.coor[2] - b.coor[2]) // sort ascending by z-index
        // Draw components
        Game.components.filter(x => x.type != 'mask').forEach(comp => {
            comp.data.lifetime += 1 
            if (comp.type == 'img') {
                let img = comp.img
                if (!Game.entities.paused && comp.data.imgs) {
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
                Game.ctx.fillStyle = comp.color || '#fff' 
                Game.ctx.textAlign = 'center'
                Game.ctx.font = `${comp.size}px Arcade Classic`
                Game.ctx.fillText(comp.text, comp.coor[0], comp.coor[1])
            } else if (comp.type == 'audio') {
								if (comp.playing) {
										if (comp.audio.paused) { 
												comp.audio.play()
										}
								} else {
										comp.audio.pause()
								}
						} else {
                throw new Exception()
            }
        })        

        // Draw masks
        Game.components.filter(x => x.type == 'mask').forEach(comp => {
            Game.ctx.globalCompositeOperation = 'destination-in'
            Game.ctx.fillStyle = comp.color
            Game.ctx.beginPath()
            Game.ctx.arc(
                comp.coor[0], // x
                comp.coor[1], // y
                comp.size * 0.5, // radius
                0, // start angle
                2 * Math.PI // end angle
            )
            Game.ctx.fill()
            // restore to default composite operation (is draw over current image)
            Game.ctx.globalCompositeOperation = 'source-over'
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
				const MUSIC_TAG = 'goodnight'
        const comp = Game.getComponent(PAUSE_TAG)
				const musicComp = Game.getComponent(MUSIC_TAG)
        if (!Game.entities.paused) { 
            Game.entities.fg = null 
            if (comp) { 
								// Newly unpaused
                Game.deleteComponent(PAUSE_TAG)
								if (!musicComp) {
										const musicComp = Game.createComponent({
												audio: new Audio('goodnight.mp3'),
												type: 'audio',
												id: MUSIC_TAG 
										})
								} else {
										musicComp.playing = true
								}
								
            }
        } else {
            Game.entities.fg = 'rgba(255, 255, 255, 1)'
            if (!comp) {
								// Newly paused
								if (musicComp) { 
										musicComp.playing = false
								}
                Game.createComponent({
                    text: '\u25B6 ',
                    type: 'text',
                    color: '#000',
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
        if (Game.entities.paused) { return }
				Game.entities.it += 1
        // Speed up render period
        //Game.entities.render_period = Math.max(Game.entities.render_period - 5, 200)
    },

		update() {
        console.log('Game.entities.it:', Game.entities.it)
        Game.systems.forEach(s => s())
			  setTimeout(
            () => window.requestAnimationFrame(Game.update), 
            Game.entities.render_period / Game.entities.speed
        )
		}
}

window.onload = Game.init
