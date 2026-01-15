document.addEventListener('DOMContentLoaded', function() {
  // Defensive: check for required elements
  const activitiesList = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const signupForm = document.getElementById('signup-form');
  const messageDiv = document.getElementById('message');

  if (!activitiesList || !activitySelect || !signupForm || !messageDiv) {
    if (activitiesList) activitiesList.innerHTML = '<p>Critical error: Required elements missing in HTML.</p>';
    return;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch('/activities');
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = '';
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        const spotsLeft = details.max_participants - details.participants.length;

        // Participants section
        let participantsHTML = '';
          if (details.participants.length > 0) {
            participantsHTML = `
              <div class="participants-section">
                <strong>Participants:</strong>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li title="${email}">\n                        <span class="participant-email">${email}</span>\n                        <button class="delete-participant-btn" title="Unregister participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" aria-label="Unregister participant">\n                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">\n                            <rect x="5" y="8" width="1.5" height="7" rx="0.75" fill="#d32f2f"/>\n                            <rect x="9.25" y="8" width="1.5" height="7" rx="0.75" fill="#d32f2f"/>\n                            <rect x="13.5" y="8" width="1.5" height="7" rx="0.75" fill="#d32f2f"/>\n                            <rect x="3" y="5" width="14" height="2" rx="1" fill="#bdbdbd"/>\n                            <rect x="7" y="2" width="6" height="2" rx="1" fill="#bdbdbd"/>\n                            <rect x="4" y="7" width="12" height="10" rx="2" stroke="#d32f2f" stroke-width="1.5" fill="none"/>\n                          </svg>\n                        </button>\n                      </li>`
                    )
                    .join('')}\n              </ul>\n            </div>\n          `;
        } else {
          participantsHTML = `
            <div class="participants-section no-participants">
              <em>No participants yet.</em>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

          // Add event listeners for delete buttons after rendering
          const deleteBtns = activityCard.querySelectorAll('.delete-participant-btn');
          deleteBtns.forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const activity = decodeURIComponent(btn.getAttribute('data-activity'));
              const email = decodeURIComponent(btn.getAttribute('data-email'));
              if (confirm(`Unregister ${email} from ${activity}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                    method: 'POST',
                  });
                  if (response.ok) {
                    fetchActivities();
                  } else {
                    alert('Failed to unregister participant.');
                  }
                } catch (err) {
                  alert('Error contacting server.');
                }
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      if (activitiesList) activitiesList.innerHTML = '<p>Failed to load activities. Please try again later.</p>';
      console.error('Error fetching activities:', error);
    }
  }

  // Handle sign up form submission
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();


      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
        signupForm.reset();
        // Refresh activities list to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'An error occurred';
        messageDiv.className = 'error';
      }

      messageDiv.classList.remove('hidden');

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 5000);
    } catch (error) {
      messageDiv.textContent = 'Failed to sign up. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
      console.error('Error signing up:', error);
    }
  });

  // Initialize app
  fetchActivities();
});
