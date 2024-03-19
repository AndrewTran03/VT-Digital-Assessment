import java.util.*;
import java.io.*;
import java.nio.file.*;

public class LineCounter {
    public static void countLinesInFiles(String directory, List<String> fileExtensions, List<String> excludeDirs, int[] totalLines, int arrIdx) {
        try {
            Files.walk(Paths.get(directory))
                .filter(path -> Files.isRegularFile(path) && !isExcluded(path, excludeDirs))
                .filter(path -> {
                    for (String extension: fileExtensions) {
                        if (path.toString().endsWith("." + extension)) {
                            return true;
                        }
                    }
                    return false;
                })
                .forEach(file -> {
                    try (BufferedReader reader = new BufferedReader(new FileReader(file.toFile()))) {
                        while (reader.readLine() != null) {
                            totalLines[arrIdx]++; // Modify the totalLines array
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    });
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static boolean isExcluded(Path path, List<String> excludeDirs) {
        return excludeDirs.stream().anyMatch(excludeDir -> path.toString().contains(excludeDir));
    }

    public static void main(String[] args) {
        String currentWorkingDirectoryStr = System.getProperty("user.dir");
        System.out.println("CURRENT WORKING DIRECTORY: " + currentWorkingDirectoryStr);

        String[] directories = { "../client/", "../server/" };
        int[] totalLines = new int[directories.length]; // Using an array to store totalLines
        for (int i = 0; i < directories.length; i++) {
            List<String> fileExtensions = List.of("ts", "tsx", "js", "jsx", "html", "css"); // Add or remove file extensions as needed
            List<String> excludeDirs = List.of("node_modules"); // Add any directories you want to exclude

            countLinesInFiles(directories[i], fileExtensions, excludeDirs, totalLines, i);
            System.out.println("Total lines in specified directory (" + directories[i] + "): " + totalLines[i]);
        }

        // Functional approach of Java Array Sum using Streams
        int sum = Arrays.stream(totalLines).sum();
        System.out.println("Total Lines in Project: " + sum);
    }
}