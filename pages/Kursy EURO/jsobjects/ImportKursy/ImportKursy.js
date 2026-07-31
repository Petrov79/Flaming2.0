export default {

    xml: "",

    async readFile() {

        if (!FilePickerKursy.files.length) {
            showAlert("Wybierz plik XML.", "warning");
            return false;
        }

        this.xml = FilePickerKursy.files[0].data;

        return true;
    }

}