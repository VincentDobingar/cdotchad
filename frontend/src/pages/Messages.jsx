import React from "react";

export default function Messages() {
  // Tu peux remplacer ce tableau par des données venant d’une API
  const messages = [
    { id: 1, from: "Admin", content: "Bienvenue sur la plateforme !" },
    { id: 2, from: "Support", content: "Votre candidature a été reçue." },
  ];

  return (
    <div>
      <h2>Mes messages</h2>
      {messages.length === 0 ? (
        <p>Aucun message pour le moment.</p>
      ) : (
        <ul>
          {messages.map((msg) => (
            <li key={msg.id} style={{ marginBottom: "1rem" }}>
              <strong>De : </strong> {msg.from}
              <br />
              <span>{msg.content}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
