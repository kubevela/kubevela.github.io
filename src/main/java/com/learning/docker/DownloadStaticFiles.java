package com.learning.docker;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.*;
import java.net.URL;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class DownloadStaticFiles {
    private static void disableSslVerification() throws Exception {
        TrustManager[] trustAllCerts = new TrustManager[]{
            new X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() { return new java.security.cert.X509Certificate[0]; }
                public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
            }
        };
        SSLContext sc = SSLContext.getInstance("TLS");
        sc.init(null, trustAllCerts, new java.security.SecureRandom());
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);
    }

    public static void main(String[] args) throws Exception {
        disableSslVerification();

        Path urlFile = Paths.get("/Users/viskumar/Documents/DockerPoc-1/src/main/java/com/learning/docker/static-image-urls.txt");
        List<String> urls;
        try (Stream<String> lines = Files.lines(urlFile)) {
            urls = lines
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && !s.startsWith("#"))
                    .collect(Collectors.toList());
        }

        Path baseDir = Paths.get("/Users/viskumar/Documents/DockerPoc-1/src/main/java/com/learning/docker/images");
        RestTemplate restTemplate = new RestTemplate();
        for (String s : urls) {
            URL url = new URL(s);
            String path = url.getPath();
            Path outPath = baseDir.resolve(path.substring(1));
            Files.createDirectories(outPath.getParent());
            System.out.println("Downloading " + s + " -> " + outPath);
            try {
                ResponseEntity<byte[]> resp = restTemplate.getForEntity(s, byte[].class);
                Files.write(outPath, resp.getBody());
            } catch (Exception e) {
                System.err.println("Failed to download " + s + ": " + e.getMessage());
            }
        }
    }
}
