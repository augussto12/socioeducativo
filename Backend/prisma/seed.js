const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = 'admin@socioeducativo.local';
const DEFAULT_ADMIN_PASSWORD = 'Cambiar123!';

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 140);
}

async function seedAdmin() {
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD is required in production');
  }

  const email = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);
  const usesDefaultPassword = !process.env.ADMIN_PASSWORD;

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: usesDefaultPassword,
      passwordHash,
    },
    create: {
      name: 'Administrador',
      email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: usesDefaultPassword,
    },
  });

  console.log(`Admin listo: ${email}`);
  if (usesDefaultPassword) {
    console.log(`Password dev por defecto: ${DEFAULT_ADMIN_PASSWORD}`);
  }

  return admin;
}

async function seedSiteContent() {
  const contents = [
    {
      key: 'home',
      title: 'Centro socioeducativo',
      content:
        'Presentacion institucional del centro, su marco de trabajo, objetivos y forma de acompanamiento pedagogico.',
    },
    {
      key: 'quienes-somos',
      title: 'Quienes somos',
      content:
        'Historia, origen, equipo actual, logros y alianzas barriales e institucionales del centro.',
    },
    {
      key: 'normativa',
      title: 'Normativa',
      content:
        'Marco normativo, institucional y estatal que encuadra el funcionamiento del centro.',
    },
    {
      key: 'objetivos',
      title: 'Objetivos',
      content:
        'Objetivos pedagogicos e institucionales del centro socioeducativo.',
    },
  ];

  for (const item of contents) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {
        title: item.title,
        content: item.content,
      },
      create: item,
    });
  }

  console.log(`${contents.length} contenidos institucionales listos`);
}

async function seedCategories() {
  const names = [
    'Huerta',
    'Juegos de mesa',
    'Costura',
    'Radio y podcast',
    'Arte',
    'Acompanamiento pedagogico',
  ];

  const categories = [];

  for (let index = 0; index < names.length; index++) {
    const name = names[index];
    const category = await prisma.projectCategory.upsert({
      where: { slug: slugify(name) },
      update: {
        name,
        displayOrder: index + 1,
      },
      create: {
        name,
        slug: slugify(name),
        displayOrder: index + 1,
      },
    });
    categories.push(category);
  }

  console.log(`${categories.length} categorias listas`);
  return categories;
}

async function seedDevelopmentProjects(admin, categories) {
  if (process.env.NODE_ENV === 'production') {
    console.log('Produccion: se omiten proyectos de ejemplo');
    return;
  }

  const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));
  const examples = [
    {
      name: 'Construccion de juegos de mesa',
      categorySlug: 'juegos-de-mesa',
      description: 'Proyecto integral para disenar, construir y documentar juegos de mesa.',
      curricularContents: 'Lengua, matematica, arte, tecnologia e ingles integrados en una produccion comun.',
      methodology: 'Trabajo por equipos, prototipado, escritura de reglas, pruebas y registro del proceso.',
      duration: '8 semanas',
      pedagogicalFoundation:
        'El juego permite integrar contenidos curriculares con produccion concreta, colaboracion y reflexion.',
    },
    {
      name: 'Huerta',
      categorySlug: 'huerta',
      description: 'Proyecto de cuidado, siembra, observacion y registro de una huerta comunitaria.',
      curricularContents: 'Ciencias naturales, ambiente, matematica aplicada y escritura de registros.',
      methodology: 'Planificacion de tareas, observacion semanal, registros fotograficos y bitacora colectiva.',
      duration: 'Cuatrimestral',
      pedagogicalFoundation:
        'La huerta como experiencia situada articula saberes escolares, territorio y cuidado comunitario.',
    },
    {
      name: 'Radio y podcast',
      categorySlug: 'radio-y-podcast',
      description: 'Proyecto de produccion sonora con entrevistas, guiones y piezas de podcast.',
      curricularContents: 'Practicas del lenguaje, comunicacion, tecnologia y expresion oral.',
      methodology: 'Taller de guion, grabacion, escucha critica, edicion basica y publicacion cuidada.',
      duration: '10 semanas',
      pedagogicalFoundation:
        'La produccion radial fortalece la palabra, la escucha, la identidad y la participacion.',
    },
    {
      name: 'Costura',
      categorySlug: 'costura',
      description: 'Proyecto de diseno y confeccion con registro de procesos, medidas y producciones.',
      curricularContents: 'Matematica, arte, tecnologia, proyecto y organizacion del trabajo.',
      methodology: 'Taller practico con planificacion, moldes, mediciones, produccion y puesta en comun.',
      duration: 'Trimestral',
      pedagogicalFoundation:
        'La costura integra saber tecnico, creatividad, autonomia y construccion de proyectos compartidos.',
    },
  ];

  for (let index = 0; index < examples.length; index++) {
    const item = examples[index];
    const project = await prisma.pedagogicalProject.upsert({
      where: { slug: slugify(item.name) },
      update: {
        description: item.description,
        curricularContents: item.curricularContents,
        methodology: item.methodology,
        duration: item.duration,
        pedagogicalFoundation: item.pedagogicalFoundation,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        displayOrder: index + 1,
        categoryId: categoryBySlug[item.categorySlug]?.id,
      },
      create: {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        curricularContents: item.curricularContents,
        methodology: item.methodology,
        duration: item.duration,
        pedagogicalFoundation: item.pedagogicalFoundation,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        displayOrder: index + 1,
        categoryId: categoryBySlug[item.categorySlug]?.id,
      },
    });

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: admin.id,
        },
      },
      update: {
        roleInProject: 'Responsable institucional',
      },
      create: {
        projectId: project.id,
        userId: admin.id,
        roleInProject: 'Responsable institucional',
      },
    });
  }

  console.log(`${examples.length} proyectos de ejemplo listos`);
}

async function main() {
  console.log('Iniciando seed socioeducativo...');

  const admin = await seedAdmin();
  await seedSiteContent();
  const categories = await seedCategories();
  await seedDevelopmentProjects(admin, categories);

  console.log('Seed completado');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
