import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

class d3LibDefCompiler{
  public static void main(String[] args) throws IOException {
    final List<String> titles = List.of(
        "VisualObject",
        "Shape",
        "Pane",
        "Grid",
        "Rectangle",
        "Circle",
        "Stage",
        "TextBox",
        "Line",
        "ConjoinedObject",
        "Polygon",
        "Graph",
        "Utility",
        "Tree"
    );
    List<String> allFiles = new ArrayList<>(List.of("export const D3_TOTAL_DEFS: string = `"));
    for (String title: titles){
      List<String> file = new ArrayList<String>();
      String fileName = "../d3-defs/" + title + ".d.ts";
      BufferedReader fileReader = new BufferedReader(new FileReader(fileName));
      String newLine = fileReader.readLine();
      while (newLine != null){
        file.add(newLine);
        newLine = fileReader.readLine();
      }
      for (String line: file){
        if (!line.contains("import")){
          String fixed = line;
          if (line.length() >= 7) {
            if (line.substring(0, 7).equals("export ")) {
              fixed = line.substring(7);
            }
          }
          allFiles.add(fixed);
        }
      }
    }
    allFiles.add("`");
    BufferedWriter fileWriter = new BufferedWriter(
        new FileWriter("../d3-defs/total-defs.ts"));
    for (String line: allFiles) {
      fileWriter.newLine();
      fileWriter.write(line);
    }
    fileWriter.close();
    System.exit(0);
  }
}