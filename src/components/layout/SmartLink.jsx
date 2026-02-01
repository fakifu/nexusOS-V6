import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '../../context/NavigationContext'; // Adapte le chemin selon ton dossier

export const SmartLink = ({ to, sectionKey, children, className }) => {
  const { memory } = useNavigation();
  // Si une sectionKey est fournie (ex: 'finance'), on regarde dans la mémoire
  // sinon on utilise le chemin 'to' par défaut.
  const targetPath = sectionKey && memory[sectionKey] ? memory[sectionKey] : to;

  return (
    <Link to={targetPath} className={className}>
      {children}
    </Link>
  );
};
