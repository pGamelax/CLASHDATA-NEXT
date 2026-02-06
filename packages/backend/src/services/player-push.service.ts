import { ClashOfClansService } from "./clash-of-clans.service";
import { PlayerRepository } from "../repositories/player.repository";
import { LegendLeagueLogRepository } from "../repositories/legend-league-log.repository";
import { ClanRepository } from "../repositories/clan.repository";

export class PlayerPushService {
  constructor(
    private clashOfClansService: ClashOfClansService,
    private playerRepository: PlayerRepository,
    private legendLeagueLogRepository: LegendLeagueLogRepository,
    private clanRepository: ClanRepository
  ) {}

  async processAllClans() {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] 🏁 Iniciando processamento de todos os clans`);
    
    // Buscar todos os clans cadastrados
    const allClans = await this.clanRepository.findAll();
    
    if (allClans.length === 0) {
      console.log(`[${new Date().toISOString()}] ⚠️  Nenhum clan cadastrado para processar`);
      return { clansProcessed: 0, playersProcessed: 0, logsCreated: 0 };
    }

    console.log(`[${new Date().toISOString()}] 📋 Total de clans para processar: ${allClans.length}`);

    const allPlayersInClans = new Set<string>();
    const processedPlayers = new Map<string, { tag: string; trophies: number; clanTag: string }>();
    let totalLogsCreated = 0;
    let totalPlayersProcessed = 0;

    // Processar cada clan
    for (const clan of allClans) {
      try {
        console.log(`[${new Date().toISOString()}] 🔄 Processando clan: ${clan.tag} - ${clan.name}`);
        const clanStartTime = Date.now();
        const membersData = await this.clashOfClansService.getClanMembers(clan.tag);
        
        if (membersData.items && Array.isArray(membersData.items)) {
          const legendLeaguePlayers = membersData.items.filter(
            (m: any) => m.leagueTier?.name === "Legend League"
          );
          
          console.log(
            `[${new Date().toISOString()}] 👥 Clan ${clan.tag}: ${membersData.items.length} membros total, ${legendLeaguePlayers.length} na Legend League`
          );

          for (const member of legendLeaguePlayers) {
            const playerTag = member.tag;
            allPlayersInClans.add(playerTag);
            
            // Processar o jogador
            const logCreated = await this.processPlayer({
              tag: playerTag,
              name: member.name,
              trophies: member.trophies,
              clanTag: clan.tag,
            });

            if (logCreated) totalLogsCreated++;
            totalPlayersProcessed++;

            processedPlayers.set(playerTag, {
              tag: playerTag,
              trophies: member.trophies,
              clanTag: clan.tag,
            });
          }

          const clanDuration = Date.now() - clanStartTime;
          console.log(
            `[${new Date().toISOString()}] ✅ Clan ${clan.tag} processado em ${clanDuration}ms`
          );
        }
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] ❌ Erro ao processar clan ${clan.tag}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Verificar jogadores que não estão mais em nenhum clan
    console.log(
      `[${new Date().toISOString()}] 🔍 Verificando jogadores que não estão mais em nenhum clan...`
    );
    const logsFromMissingPlayers = await this.processPlayersNotInClans(
      allPlayersInClans,
      Array.from(processedPlayers.values())
    );
    totalLogsCreated += logsFromMissingPlayers;

    const totalDuration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] 🎉 Processamento concluído em ${totalDuration}ms`
    );
    console.log(
      `[${new Date().toISOString()}] 📊 Estatísticas:`
    );
    console.log(`  - Clans processados: ${allClans.length}`);
    console.log(`  - Jogadores processados: ${totalPlayersProcessed}`);
    console.log(`  - Logs criados: ${totalLogsCreated}`);

    return {
      clansProcessed: allClans.length,
      playersProcessed: totalPlayersProcessed,
      logsCreated: totalLogsCreated,
    };
  }

  private async processPlayer(data: {
    tag: string;
    name: string;
    trophies: number;
    clanTag: string;
  }): Promise<boolean> {
    try {
      // Buscar ou criar o player
      const existingPlayer = await this.playerRepository.findByTag(data.tag);
      let logCreated = false;

      if (existingPlayer) {
        // Verificar se o nome mudou
        if (existingPlayer.name !== data.name) {
          await this.playerRepository.update(data.tag, { name: data.name });
          console.log(
            `[${new Date().toISOString()}] ✏️  Nome atualizado para player ${data.tag}: "${existingPlayer.name}" -> "${data.name}"`
          );
        }

        // Verificar mudança de troféus
        if (existingPlayer.trophies !== data.trophies) {
          const trophiesChange = data.trophies - existingPlayer.trophies;
          const type = trophiesChange > 0 ? "attack" : "defense";
          const absoluteChange = Math.abs(trophiesChange);

          // Criar log
          await this.legendLeagueLogRepository.create({
            playerId: existingPlayer.id,
            type,
            trophiesChange: absoluteChange,
            previousTrophies: existingPlayer.trophies,
            currentTrophies: data.trophies,
            clanTag: data.clanTag,
          });

          // Atualizar troféus do player
          await this.playerRepository.update(data.tag, { trophies: data.trophies });

          console.log(
            `[${new Date().toISOString()}] 📝 Log criado para player ${data.tag}: ${type} ${trophiesChange > 0 ? "+" : "-"}${absoluteChange} troféus (${existingPlayer.trophies} -> ${data.trophies})`
          );
          logCreated = true;
        }
      } else {
        // Criar novo player
        await this.playerRepository.create({
          tag: data.tag,
          name: data.name,
          trophies: data.trophies,
        });
        console.log(
          `[${new Date().toISOString()}] ✨ Novo player criado: ${data.tag} - ${data.name} (${data.trophies} troféus)`
        );
      }

      return logCreated;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] ❌ Erro ao processar player ${data.tag}:`,
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  private async processPlayersNotInClans(
    playersInClans: Set<string>,
    processedPlayers: Array<{ tag: string; trophies: number; clanTag: string }>
  ): Promise<number> {
    // Buscar todos os players salvos
    const allSavedPlayers = await this.playerRepository.findAll();

    // Filtrar players que não estão em nenhum clan
    const playersNotInClans = allSavedPlayers.filter(
      (player) => !playersInClans.has(player.tag)
    );

    console.log(
      `[${new Date().toISOString()}] 🔍 ${playersNotInClans.length} jogadores não encontrados em nenhum clan. Verificando individualmente...`
    );

    let logsCreated = 0;

    // Processar cada player que não está em nenhum clan
    for (const player of playersNotInClans) {
      try {
        // Buscar dados atualizados do player
        const playerData = await this.clashOfClansService.getPlayerByTag(player.tag);

        // Verificar se está na Legend League
        if (playerData.leagueTier?.name === "Legend League") {
          const currentTrophies = playerData.trophies;
          const clanTag = playerData.clan?.tag || null;

          // Verificar mudança de troféus
          if (player.trophies !== currentTrophies) {
            const trophiesChange = currentTrophies - player.trophies;
            const type = trophiesChange > 0 ? "attack" : "defense";
            const absoluteChange = Math.abs(trophiesChange);

            // Criar log
            await this.legendLeagueLogRepository.create({
              playerId: player.id,
              type,
              trophiesChange: absoluteChange,
              previousTrophies: player.trophies,
              currentTrophies: currentTrophies,
              clanTag: clanTag || undefined,
            });

            // Atualizar player
            await this.playerRepository.update(player.tag, {
              name: playerData.name,
              trophies: currentTrophies,
            });

            console.log(
              `[${new Date().toISOString()}] 📝 Log criado para player ${player.tag} (fora do clan): ${type} ${trophiesChange > 0 ? "+" : "-"}${absoluteChange} troféus (${player.trophies} -> ${currentTrophies})`
            );
            logsCreated++;
          } else {
            // Apenas atualizar o nome se mudou
            if (player.name !== playerData.name) {
              await this.playerRepository.update(player.tag, { name: playerData.name });
              console.log(
                `[${new Date().toISOString()}] ✏️  Nome atualizado para player ${player.tag} (fora do clan): "${player.name}" -> "${playerData.name}"`
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] ❌ Erro ao processar player ${player.tag} (fora do clan):`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(
      `[${new Date().toISOString()}] ✅ Processamento de jogadores fora dos clans concluído. ${logsCreated} logs criados.`
    );

    return logsCreated;
  }
}
