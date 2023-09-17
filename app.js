// Importer les travaux depuis l'API //
let loadedData = [];

async function loadWorks() {
  const response = await fetch("http://localhost:5678/api/works");
  loadedData = await response.json();
  displayWork(loadedData);
  const alertState = localStorage.getItem('alertState');
  if (alertState) {
    const { message, isSuccess } = JSON.parse(alertState);
    showAlert(message, isSuccess);
  }
}

function displayWork(data) {
  const galleryEl = document.querySelector(".gallery");
  galleryEl.innerHTML = data.map(item => `
    <figure>
      <img src="${item.imageUrl}" alt="${item.title}" crossorigin="anonymous">
      <figcaption>${item.title}</figcaption>
    </figure>
  `).join('');
}

loadWorks();

// Importer les catégories depuis l'API //

async function loadCategory() {
  const response = await fetch("http://localhost:5678/api/categories");
  const loadedData = await response.json();
  displayCategory(loadedData);
}

// Filtrer les travaux //

const filterWorks = document.querySelector("#filter-works-all");
const filterWorksObjets = document.querySelector("#filter-works-Object");
const filterWorksAppartements = document.querySelector("#filter-works-Appartements");
const filterWorksHR = document.querySelector("#filter-works-HR");

filterWorks.addEventListener("click", function () {
  displayWork(loadedData);
});

filterWorksObjets.addEventListener("click", function() {
  const filteredData = loadedData.filter(item => item.category.id === 1);
  displayWork(filteredData);
});

filterWorksAppartements.addEventListener("click", function() {
  const filteredData = loadedData.filter(item => item.category.id === 2);
  displayWork(filteredData);
});

filterWorksHR.addEventListener("click", function() {
  const filteredData = loadedData.filter(item => item.category.id === 3);
  displayWork(filteredData);
});

// Affichage de la bannière quand l'utilisateur est connecté //

function showUserBanner() {
  const userToken = localStorage.getItem("userToken");

  if (userToken) {
    const userBanner = document.getElementById('user-banner');
    userBanner.style.display = 'flex';
  }
}

showUserBanner();

// Affiche des boutons login et logout en fonction de l'état de connexion de l'utilisateur
// Affiche aussi le bouton "modifier" sur la page des projets

document.addEventListener('DOMContentLoaded', function() {
  const loginButton = document.querySelector('.login-btn');
  const logoutButton = document.querySelector('.logout-btn');
  const editButton = document.createElement('i');
  const editLabel = document.createElement('p');
  const projectsTitle = document.querySelector('.projet-title');
  const filters = document.getElementById('filters');

  // Configuration de l'icône et du libellé "modifier"

  editButton.id = 'edit-btn';
  editButton.className = 'fa-regular fa-pen-to-square', "btn-edit modal-trigger";
  editButton.style.cursor = 'pointer';
  editLabel.textContent = 'modifier';
  editLabel.style.cursor = 'pointer';

  function checkUserStatus() {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      // L'utilisateur est connecté, ajouter les éléments "modifier"
      if (projectsTitle) {
        projectsTitle.parentElement.insertBefore(editLabel, projectsTitle.nextElementSibling);
        projectsTitle.parentElement.insertBefore(editButton, projectsTitle.nextElementSibling);
  
        editButton.addEventListener('click', function() {
          toggleModal();
        });
        editLabel.addEventListener('click', function() {
          toggleModal();
        });
      }
      logoutButton.classList.remove('hidden');
      loginButton.classList.add('hidden');
      if (filters) {
        filters.classList.add('hidden');
        console.log("filters cachés");
      }
    } else {
      // L'utilisateur est déconnecté, supprimer les éléments "modifier"
      if (projectsTitle && projectsTitle.parentElement.contains(editButton)) {
        projectsTitle.parentElement.removeChild(editButton);
        projectsTitle.parentElement.removeChild(editLabel);
      }
      logoutButton.classList.add('hidden');
      loginButton.classList.remove('hidden');
      if (filters) {
        filters.classList.remove('hidden');
        console.log("filters affichés");
      }
    }
  }
  
  if (logoutButton) {
    checkUserStatus();
    logoutButton.addEventListener('click', function logout() {
      localStorage.removeItem('userToken');
      if (projectsTitle && projectsTitle.parentElement.contains(editButton)) {
        projectsTitle.parentElement.removeChild(editButton);
        projectsTitle.parentElement.removeChild(editLabel);
      }
      logoutButton.classList.add('hidden');
      loginButton.classList.remove('hidden');
      window.location.href = 'index.html';
    });
  }
});


// Ouverture de la fenêtre modale d'édition des travaux //

const modalContainer = document.querySelector(".modal-container");
const modalTriggers = document.querySelectorAll(".modal-trigger");

modalTriggers.forEach(trigger => trigger.addEventListener("click", toggleModal))

function toggleModal() {
  console.log("Toggle modal");
  modalContainer.classList.toggle("active");
  displayWorkModal(loadedData);
}

// Suppression d'un projet //

function displayWorkModal(data) {
  const modalGalleryEl = document.querySelector(".gallery-modal");
  modalGalleryEl.innerHTML = data.map(item => `
      <figure data-id="${item.id}">
        <img src="${item.imageUrl}" alt="${item.title}" crossorigin="anonymous">
        <figcaption>éditer</figcaption>
        <div class="icon-container">
            <span class="move-icon">
                <i class="fa-solid fa-arrows-up-down-left-right"></i>
            </span>
            <span class="delete-icon">
                <i class="fa-solid fa-trash-can"></i>
            </span>
        </div>
      </figure>
    `).join('');

  // Attache l'événement de suppression à chaque image dans la galerie
  const deleteIcons = modalGalleryEl.querySelectorAll(".delete-icon");
  deleteIcons.forEach(icon => icon.addEventListener("click", deleteWork));

  // Attache l'événement de suppression à la galerie
  modalGalleryEl.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-icon')) {
      deleteWork.call(event.target);
    }
  });
}

async function deleteWork() {
  const workId = this.parentElement.parentElement.dataset.id;

  // Demander une confirmation avant de supprimer
  const shouldDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?");
  if (!shouldDelete) {
    return; // Si l'utilisateur a cliqué sur "Annuler", arrêter la fonction
  }
  const response = await fetch(`http://localhost:5678/api/works/${workId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
    },
  });

  if (response.ok) {
    const work = document.querySelector(`[data-id="${workId}"]`);
    if (work) {
      work.remove();
      showAlert('Le projet a bien été supprimé !');
    } else {
    showAlert('Une erreur est survenue lors de la suppression du projet.');
  }
}
}


// Ouverture modale d'ajout d'un projet //
// Récupération des éléments HTML
const addWorkTriggerEl = document.querySelector(".valid-btn");
const addModalEl = document.getElementById("modal-add");
const editModalEl = document.querySelector(".modal-container");

const backToEditModalBtn = document.querySelector('.back-to-edit-modal');
const closeAddModalBtn = document.querySelector('#modal-add .close-modal');
const addPhotoLabel = document.querySelector('.add-photo');
const loadImgContainer = document.querySelector('.load-img');

addWorkTriggerEl.addEventListener("click", () => {
  const modalEl = document.querySelector(".modal-container.active");
  if (modalEl && modalEl.id === "modal-edit") {
    // Masquer la modale d'édition
    modalEl.classList.remove("active");
    // Ouvrir la deuxième modale
    addModalEl.classList.add("active");
  }
});

// Fermeture modale d'ajout d'un projet et retour sur Modale édition //
backToEditModalBtn.addEventListener('click', () => {
  addModalEl.classList.remove('active');
  editModalEl.classList.add('active');
  imageInput.value = '';
  loadImgContainer3.classList.remove('hidden');
  imgPreview.classList.add('hidden');
  addPhotoLabel.classList.remove('hidden');

});

closeAddModalBtn.addEventListener('click', () => {
  addModalEl.classList.remove('active');
  editModalEl.classList.add('active');
  imageInput.value = '';
  loadImgContainer3.classList.remove('hidden');
  imgPreview.classList.add('hidden');
  addPhotoLabel.classList.remove('hidden');
});

//Ajout d'un projet //
const addWorkForm = document.getElementById('add-work-form');
const loadImgContainer2 = document.querySelector('.load-img');
const loadImgContainer3 = document.querySelector('#load-init');
const imgPreview = document.getElementById('image-preview');

// Ajouter un événement pour l'affichage de l'aperçu de l'image sélectionnée
const imageInput = document.getElementById('image');
imageInput.addEventListener('input', function () {
  const imageFile = this.files[0];
  if (imageFile) {
    // Contrôle de la taille du fichier
    const maxSize = 4 * 1024 * 1024; // 4Mo
    if (imageFile.size > maxSize) {
      alert('La taille du fichier est trop grande. La taille maximale autorisée est de 4Mo.');
      this.value = ''; // réinitialiser l'input
      return;
    }

    // Contrôle du type de fichier
    if (imageFile.type !== 'image/jpeg' && imageFile.type !== 'image/jpg' && imageFile.type !== 'image/png') {
      alert('Type de fichier non autorisé. Seuls les fichiers .jpg, .jpeg et .png sont acceptés.');
      this.value = ''; // réinitialiser l'input
      return;
    }
    
    const reader = new FileReader();

    reader.addEventListener('load', function () {
      imgPreview.src = this.result;
      loadImgContainer3.classList.add('hidden');
      imgPreview.classList.remove('hidden');
      addPhotoLabel.classList.add('hidden');
    });
    reader.readAsDataURL(imageFile);
  }
});

addWorkForm.addEventListener('submit', async (e) => {
  // Vérifier l'état de l'alerte
  if (localStorage.getItem('alertState')) {
    e.preventDefault(); // Empêcher l'envoi du formulaire
  } else {
    e.preventDefault();

    // Vérifier si l'utilisateur a chargé une image
    const image = imageInput.files[0];
    if (!image) {
      alert('Vous devez charger une image.');
      return;
    }

    const authToken = localStorage.getItem("userToken");
    const url = 'http://localhost:5678/api/works';
    const formData = new FormData();

    // Ajouter les données du formulaire à l'objet FormData
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    formData.append('title', title);
    formData.append('category', category);
    formData.append('image', image);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });

      if (response.ok) {
        showAlert('Le projet a bien été ajouté !');
        const data = await response.json();
        console.log(data);
        // Fermer la modale d'ajout
        addModalEl.classList.remove('active');
        // Recharger la liste des projets
        await loadWorks();
      } else {
        showAlert('Une erreur est survenue lors de l\'ajout du projet.');
      }
    } catch (error) {
      console.error(error);
    }
  }
});

// Fonction permettant d'alerter suite supression ou ajout d'une photo //

const alertBanner = document.getElementById('alert-banner');
const alertMessage = document.getElementById('alert-message');
const alertOK = document.getElementById('alert-ok');

function showAlert(message) {
  alertMessage.textContent = message;
  alertBanner.style.display = 'flex';
  localStorage.setItem('alertState', JSON.stringify({ message, isSuccess: true }));
}

alertOK.addEventListener('click', () => {
  alertBanner.classList.add('slideUp');
  setTimeout(() => {
    alertBanner.style.display = 'none';
    alertBanner.classList.remove('slideUp');
    localStorage.removeItem('alertState'); 
    //location.reload(); 
  }, 500); 
});
