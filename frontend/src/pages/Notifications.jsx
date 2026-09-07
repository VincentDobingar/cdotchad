import React from "react";

export default function Notifications() {
  const notifications = [
    { id: 1, text: "Votre profil a été mis à jour." },
    { id: 2, text: "Nouvelle offre disponible dans votre domaine." },
  ];

  return (
    <div>
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>Pas de notifications.</p>
      ) : (
        <ul>
          {notifications.map((notif) => (
            <li key={notif.id} style={{ marginBottom: "0.75rem" }}>
              {notif.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
