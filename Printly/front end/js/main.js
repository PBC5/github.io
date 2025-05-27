import { auth, db } from './firebase-config.js';

const API_URL = 'http://localhost:8080/api';

// Agregar estas funciones al inicio del archivo
async function loginUsuario(credentials) {
    try {
        const response = await fetch(`${API_URL}/usuarios/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Error en el login');
        }
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function registrarUsuario(userData) {
    try {
        const response = await fetch('http://localhost:8080/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error('Error al registrar usuario');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Manejo del estado de autenticación
auth.onAuthStateChanged(function(user) {
    const crearPost = document.getElementById('crear-post');
    const loginRequired = document.getElementById('login-required');
    const headerAuth = document.getElementById('header-auth');

    if (user) {
        // Usuario autenticado
        crearPost.classList.remove('hidden');
        loginRequired.classList.add('hidden');
        headerAuth.innerHTML = `
            <span class="mr-2">Hola, ${user.displayName || user.email}</span>
            <button onclick="cerrarSesion()" class="btn-secondary">Cerrar Sesión</button>
        `;
    } else {
        // Usuario no autenticado
        crearPost.classList.add('hidden');
        loginRequired.classList.remove('hidden');
        headerAuth.innerHTML = `
            <a href="login.html" class="btn-secondary">Login</a>
            <a href="register.html" class="btn-primary">Registro</a>
        `;
    }
});

// Función para cerrar sesión
window.cerrarSesion = function() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
};

document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial
    const container = document.getElementById('threeContainer');
    let currentModel = null;
    let likes = 0;
    
    // Crear interfaz de usuario mejorada
    createUserInterface();
    
    // Configuración de Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Iluminación mejorada
    setupLighting();
    
    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    
    // Lista de modelos disponibles
    const availableModels = [
        {
            name: 'Damaged Helmet',
            url: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
            scale: 2,
            position: [0, 0, 0]
        },
        // Añade más modelos aquí
    ];
    
    // Cargar modelo inicial
    loadModel(availableModels[0]);
    
    function createUserInterface() {
        const ui = document.createElement('div');
        ui.className = 'model-ui';
        ui.innerHTML = `
            <div class="controls-panel">
                <h3 class="text-xl font-bold mb-4">Controles</h3>
                <button id="resetView" class="btn">Reset Vista</button>
                <button id="toggleWireframe" class="btn">Modo Wireframe</button>
                <div class="social-actions">
                    <button id="likeButton" class="btn-primary">
                        <i class="fas fa-heart"></i> <span id="likeCount">0</span>
                    </button>
                    <button id="shareButton" class="btn-primary">
                        <i class="fas fa-share"></i> Compartir
                    </button>
                </div>
                <div class="model-info">
                    <h4 id="modelName" class="text-lg font-bold"></h4>
                    <p id="modelDescription" class="text-sm"></p>
                </div>
            </div>
        `;
        container.appendChild(ui);
        
        // Event Listeners
        setupEventListeners();
    }
    
    function setupLighting() {
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        scene.add(directionalLight);
        
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
        scene.add(hemisphereLight);
    }
    
    function loadModel(modelData) {
        const loader = new THREE.GLTFLoader();
        
        // Mostrar loading spinner
        showLoading(true);
        
        loader.load(
            modelData.url,
            function(gltf) {
                if (currentModel) scene.remove(currentModel);
                
                currentModel = gltf.scene;
                currentModel.scale.setScalar(modelData.scale);
                currentModel.position.set(...modelData.position);
                
                scene.add(currentModel);
                updateModelInfo(modelData);
                showLoading(false);
                
                // Reset camera
                resetCamera();
            },
            onProgress,
            onError
        );
    }
    
    function setupEventListeners() {
        document.getElementById('resetView').addEventListener('click', resetCamera);
        document.getElementById('toggleWireframe').addEventListener('click', toggleWireframe);
        document.getElementById('likeButton').addEventListener('click', handleLike);
        document.getElementById('shareButton').addEventListener('click', handleShare);
    }
    
    function resetCamera() {
        camera.position.set(0, 1.6, 3);
        camera.lookAt(0, 1.6, 0);
        controls.reset();
      }
      
      function toggleWireframe() {
        const isWireframe = currentModel.material && currentModel.material.wireframe;
        currentModel.traverse((child) => {
          if (child.isMesh) {
            child.material.wireframe = !isWireframe;
          }
        });
      }
      
      function toggleLike() {
        likes++;
        document.getElementById('likeCount').innerText = likes;
        // Aquí puedes agregar lógica para guardar el "me gusta" en el servidor
      }
      
      function shareModel() {
        const modelName = document.getElementById('modelName').innerText;
        const shareText = `¡Mira este modelo 3D de ${modelName} que encontré!`;
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Enlace copiado al portapapeles: ' + shareText);
        }, () => {
          alert('Error al copiar el enlace. Inténtalo de nuevo más tarde.');
        });
      }
      
      function updateModelInfo(modelData) {
        document.getElementById('modelName').innerText = modelData.name;
        document.getElementById('modelDescription').innerText = modelData.description || 'Descripción no disponible';
      }
      
      function showLoading(isLoading) {
        if (isLoading) {
          const loader = document.createElement('div');
          loader.className = 'loader';
          loader.innerText = 'Cargando modelo...';
          container.appendChild(loader);
        } else {
          const loader = document.querySelector('.loader');
          if (loader) {
            container.removeChild(loader);
          }
        }
      }
      
      function onProgress(xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = xhr.loaded / xhr.total * 100;
          console.log(`Cargando modelo: ${Math.round(percentComplete)}%`);
        }
      }
      
      function onError(error) {
        console.error('Error al cargar el modelo:', error);
        showLoading(false);
      }
    
    // Ajustar el renderizador al cambiar el tamaño de la ventana
    window.addEventListener('resize', function() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Crear slider de imágenes para la galería de modelos 3D
    createImageSlider();
    
    function createImageSlider() {
      // Crear contenedor del slider
      const sliderContainer = document.createElement('div');
      sliderContainer.className = "mt-8 flex justify-center items-center";
      sliderContainer.style.position = "relative";
      sliderContainer.style.overflow = "hidden";
      sliderContainer.style.width = "100%";
      sliderContainer.style.maxWidth = "800px";
      sliderContainer.style.margin = "20px auto";
      
      // Lista de imágenes (se esperan en la carpeta "img")
      const images = [
        "img/modelo1.jpg",
        "img/modelo2.jpg",
        "img/modelo3.jpg",
        "img/modelo4.jpg",
        "img/modelo5.jpg"
      ];
      
      // Crear elemento de imagen
    //   const imgElement = document.createElement('img');
    //   imgElement.src = images[0];
    //   imgElement.alt = "Imagen del Modelo 3D";
    //   imgElement.className = "w-full rounded-lg shadow-md";
    //   sliderContainer.appendChild(imgElement);
      
      // Insertar el slider debajo del visor 3D
      const mainContainer = document.querySelector('main');
      mainContainer.appendChild(sliderContainer);
      
      // Ciclo de cambio de imágenes cada 5 segundos
      let currentIndex = 0;
      setInterval(function() {
        currentIndex = (currentIndex + 1) % images.length;
        imgElement.src = images[currentIndex];
      }, 5000);
    }
  });
  
  // Configuración de los visores de modelos
  const modelViewers = {
    modelViewer1: {
      // Modelo de coche deportivo (Three.js Example)
      model: 'https://threejs.org/examples/models/gltf/Flamingo.glb',
      camera: { position: [0, 1, 3] },
      likes: 243
    },
    modelViewer2: {
      // Modelo de casa (Three.js Example)
      model: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
      camera: { position: [0, 2, 5] },
      likes: 187
    }
  };
  
  // Inicializar todos los visores de modelos
  function initializeModelViewers() {
    Object.entries(modelViewers).forEach(([viewerId, config]) => {
      const container = document.getElementById(viewerId);
      if (!container) return;
  
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
  
      // Iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 10, 10);
      scene.add(directionalLight);
  
      // Cargar modelo
      const loader = new THREE.GLTFLoader();
      loader.load(config.model,
        (gltf) => {
          scene.add(gltf.scene);
        },
        undefined,
        (error) => console.error('Error loading model:', error)
      );
  
      // Controles
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Posición inicial de la cámara
      camera.position.set(...config.camera.position);
      
      // Animación
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
    });
  }
  
  // Sistema de likes
  document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.dataset.postId;
      const likeCount = this.querySelector('.like-count');
      let likes = parseInt(likeCount.textContent);
      
      // Toggle like
      if (!this.classList.contains('liked')) {
        likes++;
        this.classList.add('liked');
        this.querySelector('i').style.color = '#e11d48';
      } else {
        likes--;
        this.classList.remove('liked');
        this.querySelector('i').style.color = '';
      }
      
      likeCount.textContent = likes;
      
      // Aquí podrías añadir una llamada a tu API para guardar el like
      console.log(`Post ${postId} likes: ${likes}`);
    });
  });
  
  // Configuración de modelos de la galería
  const galleryModels = {
    galleryViewer1: {
      // Modelo de coche (Poly Pizza)
      model: 'https://threejs.org/examples/models/gltf/Flamingo.glb',
      camera: { position: [0, 1, 3] },
      rotation: true
    },
    galleryViewer2: {
      // Modelo de casa (Three.js Example)
      model: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
      camera: { position: [0, 2, 5] },
      rotation: false
    },
    galleryViewer3: {
      // Modelo de robot (Three.js Example)
      model: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
      camera: { position: [1, 1, 3] },
      rotation: true
    }
  };
  
  // Inicializar visores de la galería
  function initializeGalleryViewers() {
    Object.entries(galleryModels).forEach(([viewerId, config]) => {
      const container = document.getElementById(viewerId);
      if (!container) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      // Iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 10, 10);
      scene.add(directionalLight);

      // Cargar modelo
      const loader = new THREE.GLTFLoader();
      loader.load(config.model,
        (gltf) => {
          const model = gltf.scene;
          scene.add(model);
          
          // Animación de rotación si está habilitada
          if (config.rotation) {
            function animate() {
              requestAnimationFrame(animate);
              model.rotation.y += 0.005;
              renderer.render(scene, camera);
            }
            animate();
          }
        },
        undefined,
        (error) => console.error('Error loading model:', error)
      );

      // Posición inicial de la cámara
      camera.position.set(...config.camera.position);
      camera.lookAt(0, 0, 0);

      // Renderizado inicial
      renderer.render(scene, camera);
    });
  }
  
  // Inicializar todo cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    initializeModelViewers();
    initializeGalleryViewers();
  });
  
  // Modifica el evento submit del formulario
  document.getElementById('postForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!auth.currentUser) {
        alert('Debes iniciar sesión para publicar');
        return;
    }

    const formData = new FormData();
    formData.append('file', document.getElementById('modelo3d').files[0]);
    formData.append('titulo', document.getElementById('titulo').value);
    formData.append('userId', auth.currentUser.uid);

    try {
        // Subir archivo y datos a Firebase
        const fileRef = storage.ref(`modelos/${Date.now()}_${file.name}`);
        await fileRef.put(file);
        const fileUrl = await fileRef.getDownloadURL();

        // Guardar datos en Firestore
        await db.collection('modelos').add({
            titulo: document.getElementById('titulo').value,
            modeloUrl: fileUrl,
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || auth.currentUser.email,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Modelo subido correctamente');
        location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al subir el modelo');
    }
});
