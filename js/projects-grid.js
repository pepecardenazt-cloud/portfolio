import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('projects-grid-container');
  
  if (!gridContainer) return;

  // Cargar proyectos en tiempo real
  let unsubscribe;
  
  try {
    // Si es Firebase real, usamos la API real. Si es Mock, la simulada (ambas tienen la misma firma para onSnapshotCollection)
    unsubscribe = db.onSnapshotCollection('projects', (snapshot) => {
      // Limpiar contenedor antes de renderizar
      gridContainer.innerHTML = '';
      
      const docs = snapshot.docs || [];
      
      if (docs.length === 0) {
        gridContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-grey); font-family: var(--font-family);">
            <p class="text-p">No se encontraron proyectos creados. Visita el CMS para crear tu primer proyecto.</p>
          </div>
        `;
        return;
      }
      
      docs.forEach(doc => {
        const project = doc.data();
        const id = doc.id;
        
        // Crear elemento de tarjeta
        const cardLink = document.createElement('a');
        cardLink.href = `proyecto.html?id=${id}`;
        cardLink.className = 'project-card';
        cardLink.id = `project-card-${id}`;
        
        // Contenedor de la tarjeta (con la clase placeholder si no tiene imagen)
        const containerDiv = document.createElement('div');
        containerDiv.className = 'project-card-container';
        
        if (project.thumbnailUrl) {
          const img = document.createElement('img');
          img.src = project.thumbnailUrl;
          img.alt = `Mockup del proyecto ${project.title}`;
          img.loading = 'lazy';
          containerDiv.appendChild(img);
        } else {
          containerDiv.classList.add('placeholder-card');
        }
        
        // Información de la tarjeta
        const infoDiv = document.createElement('div');
        infoDiv.className = 'project-card-info';
        
        const titleH2 = document.createElement('h2');
        titleH2.className = 'project-card-title';
        titleH2.textContent = project.title || 'Título del proyecto';
        
        const companyP = document.createElement('p');
        companyP.className = 'project-card-company';
        companyP.textContent = project.company || 'Compañía';
        
        infoDiv.appendChild(titleH2);
        infoDiv.appendChild(companyP);
        
        cardLink.appendChild(containerDiv);
        cardLink.appendChild(infoDiv);
        
        gridContainer.appendChild(cardLink);
      });
    });
  } catch (error) {
    console.error('Error al escuchar el grid de proyectos:', error);
  }
  
  // Limpiar listener al desmontar o cerrar
  window.addEventListener('beforeunload', () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
});
