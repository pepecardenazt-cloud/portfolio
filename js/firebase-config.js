// Configuración de Firebase - Portafolio y CMS
// Reemplaza los valores con tus credenciales de Firebase.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc as fbAddDoc, 
  updateDoc as fbUpdateDoc, 
  deleteDoc as fbDeleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzlVvllPOkl6VkEskdWRAszLfnxu8b7Sc",
  authDomain: "portafoliopepe-427e8.firebaseapp.com",
  projectId: "portafoliopepe-427e8",
  storageBucket: "portafoliopepe-427e8.firebasestorage.app",
  messagingSenderId: "414754039121",
  appId: "1:414754039121:web:4445e54094ffb7590ddf70"
};

// Verificar si las credenciales son placeholders
const isPlaceholder = 
  firebaseConfig.apiKey.includes("TU_API_KEY") || 
  firebaseConfig.projectId.includes("TU_PROJECT_ID");

let db = null;
let storage = null;
let isRealFirebase = false;

// Helper para comprimir imágenes y convertirlas en Base64 ligero (<100KB)
async function compressImage(file, maxWidth = 900, maxHeight = 900, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar como JPEG para optimizar tamaño (excepto si es GIF o PNG transparente)
      const exportType = (file.type === 'image/png' || file.type === 'image/gif') ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(exportType, quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
  });
}

// Intentar inicializar Firebase real si no son placeholders
if (!isPlaceholder) {
  try {
    const app = initializeApp(firebaseConfig);
    const firestoreInstance = getFirestore(app);
    
    // Fachada unificada para base de datos
    db = {
      isMock: false,
      onSnapshotCollection: (collectionName, callback) => {
        const colRef = collection(firestoreInstance, collectionName);
        const q = query(colRef, orderBy("order", "asc"));
        return onSnapshot(q, (snapshot) => {
          callback(snapshot);
        }, (error) => {
          console.error(`Error en onSnapshotCollection (${collectionName}):`, error);
        });
      },
      onSnapshotDoc: (collectionName, docId, callback) => {
        const docRef = doc(firestoreInstance, collectionName, docId);
        return onSnapshot(docRef, (docSnap) => {
          callback(docSnap);
        }, (error) => {
          console.error(`Error en onSnapshotDoc (${collectionName}/${docId}):`, error);
        });
      },
      addDoc: async (collectionName, data) => {
        const colRef = collection(firestoreInstance, collectionName);
        const docRef = await fbAddDoc(colRef, data);
        return { id: docRef.id };
      },
      updateDoc: async (collectionName, docId, data) => {
        const docRef = doc(firestoreInstance, collectionName, docId);
        await fbUpdateDoc(docRef, data);
      },
      deleteDoc: async (collectionName, docId) => {
        const docRef = doc(firestoreInstance, collectionName, docId);
        await fbDeleteDoc(docRef);
      }
    };

    // Almacenamiento unificado: almacena las imágenes comprimidas en Base64 directamente en Firestore
    // Esto evita requerir configurar Storage de pago y evita errores de CORS por completo.
    storage = {
      isMock: false,
      uploadFile: async (path, file) => {
        console.log("Guardando imagen local comprimida mediante Base64 en Firestore.");
        return await compressImage(file);
      }
    };

    isRealFirebase = true;
    console.log("Firebase Cloud inicializado correctamente en producción.");
  } catch (error) {
    console.warn("Error al inicializar Firebase Cloud. Usando base de datos simulada local.", error);
  }
}

// ==========================================
// MOCK DATABASE ENGINE (Simulador de Firestore)
// ==========================================
if (!isRealFirebase) {
  console.log("Modo de desarrollo local activo. Usando base de datos simulada basada en LocalStorage.");
  
  // Datos iniciales de demostración
  const initialProjects = [
    {
      id: "prima-afp",
      slug: "prima-afp",
      title: "Rediseño web",
      company: "Prima AFP",
      thumbnailUrl: "assets/images/prima-afp.png",
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sectionsVisibility: {
        hero: true,
        summary: true,
        content: true,
        conclusions: true
      },
      hero: {
        title: "Rediseñando la experiencia de pensiones digitales",
        subtitle: "Un caso de estudio sobre cómo simplificar el acceso a fondos de jubilación para más de 2 millones de peruanos.",
        date: "Septiembre de 2025",
        tag: "Escaparate",
        ctaText: "Ver Caso de Estudio",
        ctaUrl: "#"
      },
      summary: {
        sector: "Finanzas",
        client: "Prima AFP",
        projectType: "Rediseño de la arquitectura de la información y mejora de usabilidad del contenido.",
        projectTypeLabel: "Tipo de proyecto",
        projectTypeFormat: "paragraph",
        tools: "Life centered design\nAgile Scrum\nOptimus Prima\nDesign System\nFigma\nMaze / Jothar\nExcel\nlooker studio",
        toolsLabel: "Herramientas y tecnologías",
        toolsFormat: "bullets",
        scope: "Análisis Heurístico\nBenchmark\nDiseño y tipificación de Secciones, módulos y templates para web CMS\nDiseño del Sitemap validado por un tree testing.",
        scopeLabel: "Scope del proyecto",
        scopeFormat: "bullets",
        metrics: "Centradas en el usuario: Tasa de conversión, tiempo de permanencia en la web, interacción y NPS.\nCentradas en negocio: Volumen de Aportes Voluntarios, de traspasos y transacciones de retiro y/o pensión",
        metricsLabel: "Métricas de impacto",
        metricsFormat: "bullets"
      },
      content: [
        {
          type: "text",
          textType: "paragraph",
          content: "Para comenzar el proyecto, realizamos entrevistas con usuarios reales y hallamos que más del 60% no entendía la diferencia entre el Fondo 1, 2 y 3. El diseño anterior abrumaba con números y jerga técnica."
        },
        {
          type: "multimedia",
          url: "assets/images/prima-afp.png",
          caption: "Mockup de la página de inicio rediseñada para Prima AFP, mostrando la simplificación de llamadas a la acción.",
          layoutWidth: "contained"
        },
        {
          type: "text",
          textType: "paragraph",
          content: "Rediseñamos la sección principal introduciendo un simulador interactivo sencillo de pensión futura y organizando los temas frecuentes en componentes colapsables (FAQs) limpios y estéticos."
        }
      ],
      conclusions: {
        results: "El rediseño fue testeado con 120 usuarios mostrando una tasa de éxito del 95% en la simulación de fondos. Se lanzó con éxito a producción, logrando superar las metas de negocio iniciales en los primeros dos meses de despliegue.",
        nextSteps: "Monitorear las métricas de uso con animíticas avanzadas, realizar optimizaciones de accesibilidad WCAG y diseñar la sección de aportes extraordinarios sin fin previsional."
      }
    },
    {
      id: "proyecto-2",
      slug: "proyecto-2",
      title: "Título del proyecto",
      company: "Compañía",
      thumbnailUrl: "assets/images/project2.png",
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sectionsVisibility: {
        hero: true,
        summary: true,
        content: false,
        conclusions: false
      },
      hero: {
        title: "Caso de Estudio del Proyecto 2",
        subtitle: "Resumen estratégico e impacto.",
        date: "16 de marzo de 2026",
        tag: "Por @jaimcarrasco",
        ctaText: "Explorar",
        ctaUrl: "#"
      },
      summary: {
        sector: "Tecnología",
        client: "Empresa de Software",
        projectType: "Diseño de plataforma SaaS",
        projectTypeLabel: "Tipo de proyecto",
        projectTypeFormat: "paragraph",
        tools: "Figma\nJira\nConfluence",
        toolsLabel: "Herramientas y tecnologías",
        toolsFormat: "bullets",
        scope: "UX Research\nUI Design\nDesign System",
        scopeLabel: "Scope del proyecto",
        scopeFormat: "bullets",
        metrics: "Reducción del churn rate en un 8%",
        metricsLabel: "Métricas de impacto",
        metricsFormat: "bullets"
      },
      content: [],
      conclusions: {
        results: "",
        nextSteps: ""
      }
    },
    {
      id: "proyecto-3",
      slug: "proyecto-3",
      title: "Título del proyecto",
      company: "Compañía",
      thumbnailUrl: "assets/images/project3.png",
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sectionsVisibility: {
        hero: true,
        summary: false,
        content: false,
        conclusions: false
      },
      hero: {
        title: "Caso de Estudio del Proyecto 3",
        subtitle: "Resumen estratégico e impacto.",
        ctaText: "Explorar",
        ctaUrl: "#"
      },
      summary: {
        sector: "",
        client: "",
        projectType: "",
        projectTypeLabel: "Tipo de proyecto",
        projectTypeFormat: "paragraph",
        tools: "",
        toolsLabel: "Herramientas y tecnologías",
        toolsFormat: "bullets",
        scope: "",
        scopeLabel: "Scope del proyecto",
        scopeFormat: "bullets",
        metrics: "",
        metricsFormat: "bullets"
      },
      content: [],
      conclusions: {
        results: "",
        nextSteps: ""
      }
    }
  ];

  // Cargar de localStorage o inicializar con los de demostración
  const loadLocalData = () => {
    let data = localStorage.getItem('portafolio_projects');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const prima = parsed.find(p => p.id === 'prima-afp');
        if (prima && prima.summary && (prima.summary.businessGoal !== undefined || prima.summary.toolsFormat === undefined || prima.summary.projectTypeFormat === undefined)) {
          localStorage.removeItem('portafolio_projects');
          data = null;
        }
      } catch (e) {
        localStorage.removeItem('portafolio_projects');
        data = null;
      }
    }
    if (!data) {
      localStorage.setItem('portafolio_projects', JSON.stringify(initialProjects));
      return initialProjects;
    }
    return JSON.parse(data);
  };

  const saveLocalData = (projects) => {
    localStorage.setItem('portafolio_projects', JSON.stringify(projects));
    window.dispatchEvent(new Event('storage-update'));
  };

  // Lógica mock de base de datos exponiendo la misma interfaz
  db = {
    isMock: true,
    onSnapshotCollection: (collectionName, callback) => {
      const notify = () => {
        const projects = loadLocalData();
        const sorted = [...projects].sort((a, b) => (a.order || 0) - (b.order || 0));
        callback({
          docs: sorted.map(p => ({
            id: p.id,
            data: () => p
          }))
        });
      };
      notify();
      const handler = () => notify();
      window.addEventListener('storage-update', handler);
      window.addEventListener('storage', handler);
      return () => {
        window.removeEventListener('storage-update', handler);
        window.removeEventListener('storage', handler);
      };
    },
    onSnapshotDoc: (collectionName, docId, callback) => {
      const notify = () => {
        const projects = loadLocalData();
        const p = projects.find(item => item.id === docId);
        callback({
          exists: () => !!p,
          id: docId,
          data: () => p
        });
      };
      notify();
      const handler = () => notify();
      window.addEventListener('storage-update', handler);
      window.addEventListener('storage', handler);
      return () => {
        window.removeEventListener('storage-update', handler);
        window.removeEventListener('storage', handler);
      };
    },
    addDoc: async (collectionName, data) => {
      const projects = loadLocalData();
      const id = data.slug || 'proj-' + Math.random().toString(36).substr(2, 9);
      const newProj = { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      projects.push(newProj);
      saveLocalData(projects);
      return { id };
    },
    updateDoc: async (collectionName, docId, data) => {
      const projects = loadLocalData();
      const idx = projects.findIndex(p => p.id === docId);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], ...data, updatedAt: new Date().toISOString() };
        saveLocalData(projects);
      }
    },
    deleteDoc: async (collectionName, docId) => {
      const projects = loadLocalData();
      const filtered = projects.filter(p => p.id !== docId);
      saveLocalData(filtered);
    }
  };

  // Lógica mock de Storage usando compresión para evitar límites de LocalStorage
  storage = {
    isMock: true,
    uploadFile: async (path, file) => {
      return await compressImage(file);
    }
  };
}

export { db, storage, isRealFirebase };
export default firebaseConfig;
