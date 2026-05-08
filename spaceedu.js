// Scene Setup
const container = document.getElementById('earth-container');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 8;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Remove loading text
const loadingEl = document.querySelector('.loading');

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Group to hold earth and clouds
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// Load textures and create materials
const loadTextures = async () => {
    try {
        // High quality earth textures from public CDN
        const [colorMap, bumpMap, specularMap, cloudsMap] = await Promise.all([
            textureLoader.loadAsync('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
            textureLoader.loadAsync('https://unpkg.com/three-globe/example/img/earth-topology.png'),
            textureLoader.loadAsync('https://unpkg.com/three-globe/example/img/earth-water.png'),
            textureLoader.loadAsync('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png')
        ]);

        if(loadingEl) loadingEl.style.display = 'none';

        // 1. Earth Sphere
        const earthGeometry = new THREE.SphereGeometry(2.5, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: colorMap,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specularMap: specularMap,
            specular: new THREE.Color('grey'),
            shininess: 30
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earthGroup.add(earth);

        // 2. Cloud Sphere (slightly larger)
        const cloudGeometry = new THREE.SphereGeometry(2.53, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: cloudsMap,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        earthGroup.add(clouds);

        // 3. Atmosphere Glow (Fresnel effect)
        const atmosphereGeometry = new THREE.SphereGeometry(2.6, 64, 64);
        
        // Custom shader for atmospheric glow
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate Earth and Clouds
            earth.rotation.y += 0.001;
            clouds.rotation.y += 0.0015; // Clouds rotate slightly faster

            // Smooth mouse follow rotation
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;
            
            earthGroup.rotation.y += 0.05 * (targetX - earthGroup.rotation.y);
            earthGroup.rotation.x += 0.05 * (targetY - earthGroup.rotation.x);

            renderer.render(scene, camera);
        };
        
        animate();

    } catch (err) {
        console.error("Error loading textures", err);
        if(loadingEl) loadingEl.innerText = "Failed to load Earth :(";
    }
};

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Main sun light
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// Back light to illuminate the dark side slightly
const backLight = new THREE.DirectionalLight(0x333366, 0.5);
backLight.position.set(-5, -3, -5);
scene.add(backLight);


// Mouse interaction variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// Track mouse movement
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Handle Window Resize
window.addEventListener('resize', () => {
    if(!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Start the sequence
loadTextures();
