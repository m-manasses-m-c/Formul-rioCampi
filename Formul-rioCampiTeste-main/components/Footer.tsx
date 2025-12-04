import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-5">
        <img 
          src="https://www.gov.br/transferegov/pt-br/noticias/noticias/arquivos-e-imagens/mec.png/@@images/cfa8ccbe-9bb0-4e89-8cc4-d76db9608ffd.png" 
          alt="Logo Parceiros" 
          className="h-16 md:h-20 w-auto object-contain opacity-80 hover:opacity-100 transition duration-300 mix-blend-multiply"
        />
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium tracking-wide">
            © 2025 Assistec - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;