// Advanced 3D Background with floating particles (down to up animation)
function initAdvanced3DBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Create floating particles that move upward
    const particlesCount = 1500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const velocities = [];
    
    for(let i = 0; i < particlesCount; i++) {
        positions[i*3] = (Math.random() - 0.5) * 2000;
        positions[i*3+1] = Math.random() * 1000;
        positions[i*3+2] = (Math.random() - 0.5) * 500;
        velocities.push({
            y: 0.5 + Math.random() * 1.5
        });
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x88aaff,
        size: 0.8,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Add a central glowing sphere
    const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.1,
        wireframe: true
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    
    camera.position.z = 500;
    
    let time = 0;
    
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;
        
        // Animate particles upward
        const positions = particlesGeometry.attributes.position.array;
        for(let i = 0; i < particlesCount; i++) {
            positions[i*3+1] += velocities[i].y;
            if (positions[i*3+1] > 600) {
                positions[i*3+1] = -400;
                positions[i*3] = (Math.random() - 0.5) * 2000;
                positions[i*3+2] = (Math.random() - 0.5) * 500;
            }
        }
        particlesGeometry.attributes.position.needsUpdate = true;
        
        // Rotate sphere
        sphere.rotation.x = time * 0.2;
        sphere.rotation.y = time * 0.3;
        
        // Rotate entire particle system slowly
        particlesMesh.rotation.y += 0.001;
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize when DOM is loaded
if (document.getElementById('bg-canvas')) {
    initAdvanced3DBackground();
}