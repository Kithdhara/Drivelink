package com.drivelink.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${JDBC_DATABASE_URL:}")
    private String jdbcDatabaseUrl;

    @Value("${PGHOST:}")
    private String pgHost;

    @Value("${PGPORT:5432}")
    private String pgPort;

    @Value("${PGDATABASE:drivelink_db}")
    private String pgDatabase;

    @Value("${PGUSER:postgres}")
    private String pgUser;

    @Value("${PGPASSWORD:postgres}")
    private String pgPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        // 1. Explicit JDBC_DATABASE_URL (e.g. set in Railway as jdbc:postgresql://...)
        if (jdbcDatabaseUrl != null && !jdbcDatabaseUrl.isBlank()) {
            log.info("DataSourceConfig: Using JDBC_DATABASE_URL");
            config.setDriverClassName("org.postgresql.Driver");
            config.setJdbcUrl(jdbcDatabaseUrl);
            if (pgUser != null && !pgUser.isBlank()) config.setUsername(pgUser);
            if (pgPassword != null && !pgPassword.isBlank()) config.setPassword(pgPassword);
        }
        // 2. Standard Railway DATABASE_URL (postgres://user:pass@host:port/dbname)
        else if (databaseUrl != null && !databaseUrl.isBlank() && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("jdbc:"))) {
            log.info("DataSourceConfig: Parsing DATABASE_URL");
            config.setDriverClassName("org.postgresql.Driver");

            if (databaseUrl.startsWith("jdbc:")) {
                config.setJdbcUrl(databaseUrl);
                config.setUsername(pgUser);
                config.setPassword(pgPassword);
            } else {
                try {
                    String normalized = databaseUrl
                            .replaceFirst("^postgres://", "http://")
                            .replaceFirst("^postgresql://", "http://");
                    URI uri = new URI(normalized);

                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String path = uri.getPath();
                    if (path == null || path.length() <= 1) {
                        path = "/" + (pgDatabase.isBlank() ? "railway" : pgDatabase);
                    }

                    String cleanJdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                    config.setJdbcUrl(cleanJdbcUrl);

                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && !userInfo.isBlank()) {
                        String[] userParts = userInfo.split(":", 2);
                        config.setUsername(userParts[0]);
                        if (userParts.length > 1) {
                            config.setPassword(userParts[1]);
                        }
                    } else {
                        config.setUsername(pgUser);
                        config.setPassword(pgPassword);
                    }
                    log.info("DataSourceConfig: Configured PostgreSQL at {}:{}", host, port);
                } catch (Exception e) {
                    log.warn("DataSourceConfig: Failed to parse DATABASE_URL as URI, using fallback: {}", e.getMessage());
                    String fallback = databaseUrl
                            .replaceFirst("^postgres://", "jdbc:postgresql://")
                            .replaceFirst("^postgresql://", "jdbc:postgresql://");
                    config.setJdbcUrl(fallback);
                    config.setUsername(pgUser);
                    config.setPassword(pgPassword);
                }
            }
        }
        // 3. Railway PGHOST env var
        else if (pgHost != null && !pgHost.isBlank()) {
            log.info("DataSourceConfig: Using PGHOST {}:{}", pgHost, pgPort);
            config.setDriverClassName("org.postgresql.Driver");
            config.setJdbcUrl("jdbc:postgresql://" + pgHost + ":" + pgPort + "/" + pgDatabase);
            config.setUsername(pgUser);
            config.setPassword(pgPassword);
        }
        // 4. Safe In-Memory H2 Fallback (keeps app alive if Postgres not yet linked)
        else {
            log.warn("DataSourceConfig: No cloud PostgreSQL configured. Starting with in-memory H2 database.");
            config.setDriverClassName("org.h2.Driver");
            config.setJdbcUrl("jdbc:h2:mem:drivelink_db;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH");
            config.setUsername("sa");
            config.setPassword("");
        }

        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
