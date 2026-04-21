const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Admin User ─────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created (admin / admin123)');

  // ─── Game Types ─────────────────────────────────────────
  const gameTypes = await Promise.all([
    prisma.gameType.upsert({
      where: { name: 'Ping Pong' },
      update: {},
      create: {
        name: 'Ping Pong',
        icon: '🏓',
        description: 'Tenis de mesa competitivo',
        rulesMd: '## Reglas\n- Partidos al mejor de 3 sets\n- Sets a 11 puntos\n- 2 puntos de ventaja',
      },
    }),
    prisma.gameType.upsert({
      where: { name: 'Ajedrez' },
      update: {},
      create: {
        name: 'Ajedrez',
        icon: '♟️',
        description: 'Ajedrez clásico con reloj',
        rulesMd: '## Reglas\n- Tiempo: 10 minutos por jugador\n- Tablas cuentan como empate\n- Se aplican reglas FIDE estándar',
      },
    }),
    prisma.gameType.upsert({
      where: { name: 'Truco' },
      update: {},
      create: {
        name: 'Truco',
        icon: '🃏',
        description: 'Truco argentino a 30 puntos',
        rulesMd: '## Reglas\n- Partidos a 30 puntos\n- Se permite el "envido" y "truco"\n- Equipos de 2 jugadores',
      },
    }),
    prisma.gameType.upsert({
      where: { name: 'Futsal' },
      update: {},
      create: {
        name: 'Futsal',
        icon: '⚽',
        description: 'Fútbol sala 5v5',
        rulesMd: '## Reglas\n- 2 tiempos de 15 minutos\n- 5 jugadores por equipo\n- Sin offside',
      },
    }),
  ]);
  console.log(`✅ ${gameTypes.length} game types created`);

  // ─── Teams ──────────────────────────────────────────────
  const teamData = [
    { name: 'Los Halcones', desc: '## Los Halcones 🦅\n\nEquipo fundado en 2024. Especialistas en deportes de mesa.\n\n**Lema:** *Volamos alto, jugamos fuerte*' },
    { name: 'Dragones Rojos', desc: '## Dragones Rojos 🐉\n\nFuria y estrategia. No nos rendimos nunca.\n\n**Lema:** *Con fuego en el corazón*' },
    { name: 'Tiburones', desc: '## Tiburones 🦈\n\nDominadores del espacio de juego.\n\n**Lema:** *En el agua somos reyes*' },
    { name: 'Panteras Negras', desc: '## Panteras Negras 🐆\n\nVelocidad y precisión en cada jugada.\n\n**Lema:** *Silenciosos pero letales*' },
    { name: 'Los Vikingos', desc: '## Los Vikingos ⚔️\n\nGuerreros del norte. Competidores natos.\n\n**Lema:** *La gloria o nada*' },
    { name: 'Fénix Dorado', desc: '## Fénix Dorado 🔥\n\nSiempre renacemos. De las cenizas a la victoria.\n\n**Lema:** *De las cenizas, campeones*' },
  ];

  const teams = [];
  const credentials = [];

  for (const td of teamData) {
    const team = await prisma.team.upsert({
      where: { name: td.name },
      update: {},
      create: {
        name: td.name,
        descriptionMd: td.desc,
      },
    });
    teams.push(team);

    // Create user for team
    const username = td.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
    const password = `equipo${teams.length}23`;
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash,
        role: 'TEAM',
        teamId: team.id,
      },
    });

    credentials.push({ team: td.name, username, password });
  }
  console.log(`✅ ${teams.length} teams created with users`);

  // ─── Players ────────────────────────────────────────────
  const playerNames = [
    ['Mateo', 'García'], ['Santiago', 'López'], ['Valentín', 'Martínez'],
    ['Benjamín', 'rodríguez'], ['Thiago', 'Fernández'], ['Lucas', 'González'],
    ['Facundo', 'Díaz'], ['Joaquín', 'Pérez'], ['Nicolás', 'Romero'],
    ['Tomás', 'Sosa'], ['Agustín', 'Torres'], ['Lautaro', 'Álvarez'],
    ['Franco', 'Ruiz'], ['Máximo', 'Ramírez'], ['Bautista', 'Morales'],
    ['Emiliano', 'Gutiérrez'], ['Ian', 'Castro'], ['Bruno', 'Ortiz'],
  ];

  let playerIdx = 0;
  for (const team of teams) {
    // 3 players per team in seed
    for (let i = 0; i < 3; i++) {
      const [firstName, lastName] = playerNames[playerIdx % playerNames.length];
      await prisma.player.upsert({
        where: { id: `seed-player-${team.id}-${i}` },
        update: {},
        create: {
          teamId: team.id,
          firstName,
          lastName,
          nickname: i === 0 ? `El ${firstName.substring(0, 4)}` : null,
        },
      });
      playerIdx++;
    }
  }
  console.log(`✅ Players created (3 per team)`);

  // ─── Sample Tournament (Round Robin - Ping Pong) ───────
  const pingPongType = gameTypes[0];
  const tournament = await prisma.tournament.upsert({
    where: { id: 'seed-tournament-1' },
    update: {},
    create: {
      id: 'seed-tournament-1',
      name: 'Copa Ping Pong 2026',
      gameTypeId: pingPongType.id,
      format: 'ROUND_ROBIN',
      status: 'DRAFT',
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      description: 'Primer torneo de Ping Pong del año. Todos contra todos, ida simple.',
      startDate: new Date('2026-05-01'),
    },
  });

  // Enroll all teams
  for (let i = 0; i < teams.length; i++) {
    await prisma.tournamentTeam.upsert({
      where: {
        tournamentId_teamId: { tournamentId: tournament.id, teamId: teams[i].id },
      },
      update: {},
      create: {
        tournamentId: tournament.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });
  }
  console.log('✅ Sample tournament created with all teams enrolled');

  // ─── Print Credentials ─────────────────────────────────
  console.log('\n📋 Credenciales de acceso:');
  console.log('─'.repeat(50));
  console.log(`  Admin:    admin / admin123`);
  console.log('─'.repeat(50));
  for (const cred of credentials) {
    console.log(`  ${cred.team.padEnd(20)} ${cred.username} / ${cred.password}`);
  }
  console.log('─'.repeat(50));
  console.log('\n✨ Seed completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
