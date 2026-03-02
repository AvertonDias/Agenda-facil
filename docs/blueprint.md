# **App Name**: AgendaFácil Pro

## Core Features:

- Registro e Configuração da Empresa: Permite aos proprietários de salões cadastrar sua empresa, definir informações básicas, horários de funcionamento, serviços oferecidos, tempo de buffer e fuso horário. A base de dados do Firestore garante o armazenamento seguro dessas informações.
- Gestão de Serviços: Painel intuitivo para que os administradores criem, editem e excluam serviços, definindo sua duração, preço base e tempo de buffer entre agendamentos. Gerenciado via Firestore.
- Gestão de Colaboradores: Interface para adicionar e gerenciar a equipe, atribuindo serviços específicos a cada colaborador, definindo seus horários de trabalho e percentuais de comissão. Os dados são persistidos no Firestore.
- Agenda Administrativa Inteligente: Um painel de calendário que exibe a agenda dos colaboradores, permitindo que os administradores criem, editem, cancelem ou bloqueiem manualmente horários, utilizando um motor de disponibilidade no backend para prevenir conflitos.
- Portal de Agendamento do Cliente (PWA): Um Progressive Web App (PWA) de fácil acesso para clientes agendarem serviços, visualizando a disponibilidade em tempo real e escolhendo profissionais através de um link personalizado para cada salão. A persistência dos agendamentos é feita no Firestore.
- Geração e Envio de Confirmações via WhatsApp: Ferramenta na interface do administrador para o envio manual de confirmações de agendamento diretamente via WhatsApp para os clientes, utilizando a WhatsApp Cloud API da Meta.
- Ferramenta de Geração de Texto para Mensagens: Uma ferramenta que utiliza inteligência artificial para auxiliar o salão na criação de templates de mensagens personalizados para o WhatsApp, sugerindo tons e conteúdos adequados para diferentes tipos de agendamentos e clientes.

## Style Guidelines:

- Esquema de cores: Luz. Transmite clareza, profissionalismo e leveza, adequado para uma ferramenta de gerenciamento e beleza.
- Cor primária: Verde Suave (#53A181). Evoca frescor, tranquilidade e modernidade, ideal para um ambiente de beleza e bem-estar.
- Cor de fundo: Branco Esverdeado Sutil (#F0F5F2). Uma base neutra e relaxante que realça o conteúdo e a usabilidade da plataforma.
- Cor de destaque: Verde Vibrante (#298A29). Um verde mais escuro e vivo para chamar atenção a ações importantes, botões e elementos interativos.
- Fontes: 'Inter' (sans-serif) para todo o texto. Uma escolha moderna, limpa e altamente legível que oferece um estilo objetivo e funcional, perfeita para dashboards e fluxos de agendamento.
- Ícones: Utilizar ícones vetoriais modernos, lineares e de contorno. Preferir ícones minimalistas e intuitivos que se integrem ao design clean e facilitem a navegação rápida pelos recursos da plataforma.
- Disposição: Adotar um layout modular e responsivo. Elementos bem espaçados, hierarquia visual clara para fácil escaneamento de informações e adaptabilidade perfeita a diferentes tamanhos de tela. Priorizar painéis e cards para organizar dados complexos como agenda e lista de serviços.
- Animações: Animações sutis e funcionais. Transições suaves ao navegar entre seções, microinterações para feedback de cliques e carregamento, a fim de criar uma experiência de usuário fluida e responsiva sem distrações.